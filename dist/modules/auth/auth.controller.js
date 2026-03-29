"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySupplier = exports.forgotPassword = exports.refreshToken = exports.verifyEmail = exports.login = exports.signupSupplier = exports.signupBuyer = void 0;
const prisma_client_1 = __importDefault(require("../../core/database/prisma.client"));
const password_utils_1 = require("../../core/utils/password.utils");
const jwt_utils_1 = require("../../core/utils/jwt.utils");
const email_utils_1 = require("../../core/utils/email.utils");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const signupBuyer = async (req, res) => {
    try {
        const validatedData = req.body;
        const existingUser = await prisma_client_1.default.user.findUnique({ where: { email: validatedData.email } });
        if (existingUser)
            return res.status(400).json({ message: 'Email already exists' });
        const hashedPassword = await (0, password_utils_1.hashPassword)(validatedData.password);
        const user = await prisma_client_1.default.user.create({
            data: {
                email: validatedData.email,
                password: hashedPassword,
                firstName: validatedData.firstName,
                lastName: validatedData.lastName,
                role: client_1.UserRole.BUYER,
                isVerified: false,
                buyerProfile: {
                    create: {}
                }
            }
        });
        // Generate simple verification token
        const verifyToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_ACCESS_SECRET || 'secret', { expiresIn: '24h' });
        await (0, email_utils_1.sendVerificationEmail)(user.email, verifyToken);
        res.status(201).json({ message: 'Buyer account created. Please verify your email.' });
    }
    catch (error) {
        res.status(400).json({ error: error.message || error.errors });
    }
};
exports.signupBuyer = signupBuyer;
const signupSupplier = async (req, res) => {
    try {
        const validatedData = req.body;
        const existingUser = await prisma_client_1.default.user.findUnique({ where: { email: validatedData.email } });
        if (existingUser)
            return res.status(400).json({ message: 'Email already exists' });
        // Ensure registration number is unique
        const existingSupplier = await prisma_client_1.default.supplierProfile.findUnique({ where: { registrationNumber: validatedData.registrationNumber } });
        if (existingSupplier)
            return res.status(400).json({ message: 'Registration number already exists' });
        const hashedPassword = await (0, password_utils_1.hashPassword)(validatedData.password);
        const user = await prisma_client_1.default.user.create({
            data: {
                email: validatedData.email,
                password: hashedPassword,
                firstName: validatedData.firstName,
                lastName: validatedData.lastName,
                role: client_1.UserRole.SUPPLIER,
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
        const verifyToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_ACCESS_SECRET || 'secret', { expiresIn: '24h' });
        await (0, email_utils_1.sendVerificationEmail)(user.email, verifyToken);
        res.status(201).json({ message: 'Supplier account created. Please verify your email.' });
    }
    catch (error) {
        res.status(400).json({ error: error.message || error.errors });
    }
};
exports.signupSupplier = signupSupplier;
const login = async (req, res) => {
    try {
        const validatedData = req.body;
        const user = await prisma_client_1.default.user.findUnique({ where: { email: validatedData.email } });
        if (!user)
            return res.status(401).json({ message: 'Invalid credentials' });
        const isMatch = await (0, password_utils_1.comparePasswords)(validatedData.password, user.password);
        if (!isMatch)
            return res.status(401).json({ message: 'Invalid credentials' });
        // Optional: enforce email verification before login
        // if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email first' });
        const payload = { userId: user.id, role: user.role };
        const accessToken = (0, jwt_utils_1.generateAccessToken)(payload);
        const refreshToken = (0, jwt_utils_1.generateRefreshToken)(payload);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        res.json({ accessToken, user: { id: user.id, role: user.role, email: user.email, isVerified: user.isVerified } });
    }
    catch (error) {
        res.status(400).json({ error: error.message || error.errors });
    }
};
exports.login = login;
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token)
            return res.status(400).json({ message: 'Missing token' });
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET || 'secret');
        await prisma_client_1.default.user.update({
            where: { id: decoded.userId },
            data: { isVerified: true },
        });
        res.json({ message: 'Email successfully verified' });
    }
    catch (error) {
        res.status(400).json({ message: 'Invalid or expired token' });
    }
};
exports.verifyEmail = verifyEmail;
const refreshToken = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token)
            return res.status(401).json({ message: 'No refresh token' });
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret');
        const user = await prisma_client_1.default.user.findUnique({ where: { id: payload.userId } });
        if (!user)
            return res.status(401).json({ message: 'User not found' });
        const newAccessToken = (0, jwt_utils_1.generateAccessToken)({ userId: user.id, role: user.role });
        res.json({ accessToken: newAccessToken });
    }
    catch (error) {
        res.status(403).json({ message: 'Invalid refresh token' });
    }
};
exports.refreshToken = refreshToken;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await prisma_client_1.default.user.findUnique({ where: { email } });
        // Don't reveal if user exists for security
        if (!user)
            return res.json({ message: 'If that email exists, a reset link has been sent' });
        const resetToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_ACCESS_SECRET || 'secret', { expiresIn: '1h' });
        // Real implementation should send email with reset link
        console.log(`Password reset link for ${email}: /reset-password?token=${resetToken}`);
        // Audit Log example
        await prisma_client_1.default.auditLog.create({
            data: { userId: user.id, action: 'PASSWORD_RESET_REQUESTED', ipAddress: req.ip }
        });
        res.json({ message: 'If that email exists, a reset link has been sent' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.forgotPassword = forgotPassword;
// Admin only
const verifySupplier = async (req, res) => {
    try {
        const { supplierId } = req.params;
        const adminUserId = req.user?.userId;
        const supplier = await prisma_client_1.default.user.update({
            where: { id: supplierId },
            data: { isVerified: true }
        });
        await prisma_client_1.default.auditLog.create({
            data: { userId: adminUserId || 'SYSTEM', action: 'SUPPLIER_VERIFIED', details: `Verified supplier ${supplierId}` }
        });
        res.json({ message: 'Supplier successfully verified' });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.verifySupplier = verifySupplier;
