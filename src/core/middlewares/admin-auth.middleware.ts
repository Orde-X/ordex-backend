import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { AppError } from './error.middleware';
import prisma from '../database/prisma.client';

/**
 * Admin auth middleware — verifies the ADMIN_JWT_SECRET (HS256) bearer token.
 * Only valid for routes under /api/v1/admin.
 *
 * Admin tokens are a separate JWT signed with ADMIN_JWT_SECRET — completely
 * independent of vendor RS256 tokens.
 */
export const adminAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
    }

    const token = header.split(' ')[1];

    // Lazy import to avoid circular deps with jwt.utils
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, env.ADMIN_JWT_SECRET) as {
      adminId: string;
      role: string;
    };

    if (decoded.role !== 'ADMIN') {
      return next(new AppError('Forbidden: admin access only', 403, 'FORBIDDEN'));
    }

    // Verify admin exists in DB
    const admin = await prisma.user.findUnique({
      where: { id: decoded.adminId },
      select: { id: true, role: true, isVerified: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return next(new AppError('Forbidden: not an admin', 403, 'FORBIDDEN'));
    }

    // Attach to request
    (req as Request & { adminId: string }).adminId = decoded.adminId;

    next();
  } catch {
    next(new AppError('Invalid or expired admin token', 401, 'UNAUTHORIZED'));
  }
};

// ─── Augment Express Request type ────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      /** Set by adminAuthMiddleware */
      adminId?: string;
    }
  }
}
