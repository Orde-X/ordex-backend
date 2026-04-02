import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  userId?: string;
  vendor_id?: string;
  email?: string;
  plan_id?: string;
  role?: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
  });
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_PUBLIC_KEY, { algorithms: ['RS256'] }) as JwtPayload;
};

// Aliased for backwards compatibility but we'll use verifyToken going forward
export const verifyAccessToken = verifyToken;
export const verifyRefreshToken = verifyToken;
