import { Request, Response } from 'express';
import { BuyerSignupInput, SupplierSignupInput, LoginInput } from './auth.types';
import prisma from '../../../core/database/prisma.client';
import { hashPassword, comparePasswords } from '../../../core/utils/password.utils';
import { generateAccessToken, generateRefreshToken } from '../../../core/utils/jwt.utils';
import { sendVerificationEmail } from '../../../core/utils/email.utils';
import { UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';

export const signupBuyer = async (req: Request, res: Response) => {
  try {
    const validatedData: BuyerSignupInput = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email: validatedData.email } });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    const hashedPassword = await hashPassword(validatedData.password);

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: UserRole.BUYER,
        isVerified: false,
        buyerProfile: {
          create: {}
        }
      }
    });

    // Generate simple verification token
    const verifyToken = jwt.sign({ userId: user.id }, process.env.JWT_ACCESS_SECRET || 'secret', { expiresIn: '24h' });
    await sendVerificationEmail(user.email, verifyToken);

    res.status(201).json({ message: 'Buyer account created. Please verify your email.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || error.errors });
  }
};

export const signupSupplier = async (req: Request, res: Response) => {
  try {
    const validatedData: SupplierSignupInput = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email: validatedData.email } });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    // Ensure registration number is unique
    const existingSupplier = await prisma.supplierProfile.findUnique({ where: { registrationNumber: validatedData.registrationNumber } });
    if (existingSupplier) return res.status(400).json({ message: 'Registration number already exists' });

    const hashedPassword = await hashPassword(validatedData.password);

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: UserRole.SUPPLIER,
        isVerified: false, // Supplier Admin Verification Toggle will handle access
        supplierProfile: {
          create: {
            companyName: validatedData.companyName,
            registrationNumber: validatedData.registrationNumber,
            businessType: validatedData.businessType,
          }
        }
      }
    });

    const verifyToken = jwt.sign({ userId: user.id }, process.env.JWT_ACCESS_SECRET || 'secret', { expiresIn: '24h' });
    await sendVerificationEmail(user.email, verifyToken);

    res.status(201).json({ message: 'Supplier account created. Please verify your email.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || error.errors });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData: LoginInput = req.body;
    const user = await prisma.user.findUnique({ where: { email: validatedData.email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await comparePasswords(validatedData.password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Optional: enforce email verification before login
    // if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email first' });

    const payload = { userId: user.id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ accessToken, user: { id: user.id, role: user.role, email: user.email, isVerified: user.isVerified } });
  } catch (error: any) {
    res.status(400).json({ error: error.message || error.errors });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Missing token' });

    const decoded = jwt.verify(token as string, process.env.JWT_ACCESS_SECRET || 'secret') as { userId: string };
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { isVerified: true },
    });

    res.json({ message: 'Email successfully verified' });
  } catch (error) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret') as { userId: string, role: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ message: 'User not found' });

    const newAccessToken = generateAccessToken({ userId: user.id, role: user.role });
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    // Don't reveal if user exists for security
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent' });

    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_ACCESS_SECRET || 'secret', { expiresIn: '1h' });
    // Real implementation should send email with reset link
    console.log(`Password reset link for ${email}: /reset-password?token=${resetToken}`);

    // Audit Log example
    await prisma.auditLog.create({
      data: { userId: user.id, action: 'PASSWORD_RESET_REQUESTED', ipAddress: req.ip }
    });

    res.json({ message: 'If that email exists, a reset link has been sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin only
export const verifySupplier = async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const adminUserId = (req as any).user?.userId;

    const supplier = await prisma.user.update({
      where: { id: supplierId as string },
      data: { isVerified: true }
    });

    await prisma.auditLog.create({
      data: { userId: adminUserId || 'SYSTEM', action: 'SUPPLIER_VERIFIED', details: `Verified supplier ${supplierId}` }
    });

    res.json({ message: 'Supplier successfully verified' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

