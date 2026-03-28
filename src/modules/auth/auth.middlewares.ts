import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../../core/utils/jwt.utils';
import { UserRole } from '@prisma/client';
import prisma from '../../core/database/prisma.client';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

export const isAuthenticated = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
      role: payload.role as UserRole
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const checkRole = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

export const isResourceOwner = (paramName: string = 'id') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // In a real implementation this might fetch the resource to check its ownerId.
    // For simplicity, if the resource ID is equal to the user ID (e.g. updating profile):
    const resourceId = req.params[paramName];
    if (resourceId === req.user.userId) {
      return next();
    }

    // Example: checking a Product ownership
    if (paramName === 'productId') {
      const product = await prisma.product.findUnique({ where: { id: resourceId } } as any);
      if (product && (product as any).supplierId === req.user.userId) {
        return next();
      }
    }

    return res.status(403).json({ message: 'Forbidden: You do not own this resource' });
  };
};
