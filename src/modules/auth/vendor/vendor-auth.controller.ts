import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../../../core/database/prisma.client';
import { generateAccessToken, generateRefreshToken } from '../../../core/utils/jwt.utils';
import { EGYPTIAN_GOVERNORATES } from '../../../core/db/seeds/governorates';
import { AppError } from '../../../core/middlewares/error.middleware';
import { getRedisClient } from '../../../core/queue/redis.client';
import { VendorRegisterInput, VendorLoginInput, VendorProfileUpdateInput } from './vendor-auth.schema';

const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 3600 * 1000; // 30 days

export const registerVendor = async (req: Request, res: Response) => {
  const data: VendorRegisterInput = req.body;

  // Ensure store_slug is unique
  const existingSlug = await prisma.vendor.findUnique({
    where: { storeSlug: data.store_slug },
  });
  if (existingSlug) {
    throw new AppError('Store slug is already taken', 400, 'SLUG_IN_USE');
  }

  // Ensure email is unique
  const existingEmail = await prisma.vendor.findUnique({
    where: { email: data.email },
  });
  if (existingEmail) {
    throw new AppError('Email is already registered', 400, 'EMAIL_IN_USE');
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  // Prisma transaction to create vendor and 27 delivery zones
  const vendor = await prisma.$transaction(async (tx) => {
    const newVendor = await tx.vendor.create({
      data: {
        businessNameAr: data.business_name_ar,
        businessNameEn: data.business_name_en,
        email: data.email,
        phone: data.phone,
        passwordHash,
        storeSlug: data.store_slug,
      },
    });

    // Seed 27 delivery zones
    const zonesData = EGYPTIAN_GOVERNORATES.map((gov) => ({
      vendorId: newVendor.id,
      governorate: gov,
      fee: 0,
    }));
    await tx.deliveryZone.createMany({
      data: zonesData,
    });

    return newVendor;
  });

  const payload = { vendor_id: vendor.id, email: vendor.email };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await prisma.vendor.update({
    where: { id: vendor.id },
    data: { refreshTokenHash },
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  // Use the standard JSON envelope if attached via middleware, else generic reply
  const responseData = {
    accessToken,
    vendor: {
      id: vendor.id,
      business_name_ar: vendor.businessNameAr,
      store_slug: vendor.storeSlug,
      email: vendor.email,
    },
  };

  if ((res as any).success) {
    (res as any).success(responseData);
  } else {
    res.status(201).json({ data: responseData, meta: null, error: null });
  }
};

export const loginVendor = async (req: Request, res: Response) => {
  const data: VendorLoginInput = req.body;

  const vendor = await prisma.vendor.findUnique({
    where: { email: data.email },
  });
  if (!vendor) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const isMatch = await bcrypt.compare(data.password, vendor.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const payload = { vendor_id: vendor.id, email: vendor.email, plan_id: vendor.planId || undefined };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await prisma.vendor.update({
    where: { id: vendor.id },
    data: { refreshTokenHash },
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  const responseData = {
    accessToken,
    vendor: {
      id: vendor.id,
      business_name_ar: vendor.businessNameAr,
      store_slug: vendor.storeSlug,
      email: vendor.email,
    },
  };

  if ((res as any).success) {
    (res as any).success(responseData);
  } else {
    res.json({ data: responseData, meta: null, error: null });
  }
};

export const refreshVendorToken = async (req: Request, res: Response) => {
  const token = req.cookies?.refresh_token;
  if (!token) {
    throw new AppError('Refresh token missing', 401, 'MISSING_REFRESH_TOKEN');
  }

  // Use jwt verify manually to catch errors properly, or standard utility
  let decoded: any;
  try {
    const { verifyToken } = require('../../../core/utils/jwt.utils');
    decoded = verifyToken(token);
  } catch (err) {
    throw new AppError('Invalid refresh token', 403, 'INVALID_REFRESH_TOKEN');
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: decoded.vendor_id as string },
  });
  
  if (!vendor || !vendor.refreshTokenHash) {
    throw new AppError('Invalid refresh token session', 403, 'INVALID_REFRESH_SESSION');
  }

  const isMatch = await bcrypt.compare(token, vendor.refreshTokenHash);
  if (!isMatch) {
    throw new AppError('Refresh token reused or invalidated', 403, 'REUSED_REFRESH_TOKEN');
  }

  const payload = { vendor_id: vendor.id, email: vendor.email, plan_id: vendor.planId || undefined };
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
  await prisma.vendor.update({
    where: { id: vendor.id },
    data: { refreshTokenHash: newRefreshTokenHash },
  });

  res.cookie('refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  const responseData = { accessToken: newAccessToken };
  if ((res as any).success) {
    (res as any).success(responseData);
  } else {
    res.json({ data: responseData, meta: null, error: null });
  }
};

export const logoutVendor = async (req: Request, res: Response) => {
  const vendorId = (req as any).vendorId;
  if (vendorId) {
    await prisma.vendor.update({
      where: { id: vendorId },
      data: { refreshTokenHash: null },
    });
  }

  res.clearCookie('refresh_token');
  if ((res as any).success) {
    (res as any).success({ message: 'Logged out successfully' });
  } else {
    res.json({ data: { message: 'Logged out successfully' }, meta: null, error: null });
  }
};

export const getMe = async (req: Request, res: Response) => {
  const vendorId = (req as any).vendorId;
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: {
       id: true,
       businessNameAr: true,
       businessNameEn: true,
       email: true,
       phone: true,
       storeSlug: true,
       logoUrl: true,
       bannerUrl: true,
       settings: true,
       planId: true,
       trialEndsAt: true,
       isActive: true,
       createdAt: true,
    }
  });

  if (!vendor) {
    throw new AppError('Vendor not found', 404, 'NOT_FOUND');
  }

  if ((res as any).success) {
    (res as any).success(vendor);
  } else {
    res.json({ data: vendor, meta: null, error: null });
  }
};

export const updateVendorProfile = async (req: Request, res: Response) => {
  const vendorId = (req as any).vendorId;
  const data: VendorProfileUpdateInput = req.body;

  const updateData: any = {};
  if (data.business_name_ar !== undefined) updateData.businessNameAr = data.business_name_ar;
  if (data.business_name_en !== undefined) updateData.businessNameEn = data.business_name_en;
  if (data.logo_url !== undefined) updateData.logoUrl = data.logo_url;
  if (data.banner_url !== undefined) updateData.bannerUrl = data.banner_url;
  if (data.settings !== undefined) updateData.settings = data.settings;

  const vendor = await prisma.vendor.update({
    where: { id: vendorId },
    data: updateData,
    select: {
       id: true,
       businessNameAr: true,
       businessNameEn: true,
       logoUrl: true,
       bannerUrl: true,
       settings: true,
       storeSlug: true, // Needed for cache invalidation
    }
  });

  const redis = getRedisClient();
  await redis.del(`store:${vendor.storeSlug}`);

  if ((res as any).success) {
    (res as any).success(vendor);
  } else {
    res.json({ data: vendor, meta: null, error: null });
  }
};
