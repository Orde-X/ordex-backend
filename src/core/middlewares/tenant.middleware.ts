import { Request, Response, NextFunction } from 'express';

import { AppError } from './error.middleware';

/**
 * Vendor tenant middleware — MUST be applied AFTER authMiddleware on every
 * vendor-scoped route.
 *
 * Extracts vendor_id from the verified JWT payload (set by authMiddleware as
 * req.vendor) and attaches it to req.vendorId.
 *
 * CRITICAL security rule: all service-layer queries MUST use req.vendorId.
 * NEVER trust vendor_id from req.body, req.query, or req.params — those can
 * be forged by the client.
 */
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // req.vendor is set by the auth middleware after JWT verification
  const vendorId = (req as Request & { vendor?: { vendor_id?: string } }).vendor?.vendor_id;

  if (!vendorId) {
    return next(new AppError('Forbidden: tenant context missing', 403, 'TENANT_FORBIDDEN'));
  }

  // Attach to request — services ONLY read from here
  (req as Request & { vendorId: string }).vendorId = vendorId;

  next();
};

// ─── Augment Express Request type ────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      /** Set by authMiddleware — decoded JWT payload for the authenticated vendor */
      vendor?: {
        vendor_id: string;
        email: string;
        plan_id?: string;
      };
      /** Set by tenantMiddleware — use this in ALL vendor-scoped queries */
      vendorId?: string;
    }
  }
}
