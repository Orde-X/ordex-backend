import { Request, Response, NextFunction } from 'express';
import prisma from '../database/prisma.client';
import { AppError } from './error.middleware';

/**
 * Plan guard middleware — rejects write operations when:
 * 1. The vendor's trial has expired (trialEndsAt < now), OR
 * 2. The vendor has hit their plan's product or monthly order limit.
 *
 * Apply AFTER authMiddleware + tenantMiddleware on product/order create routes.
 *
 * Usage:
 *   router.post('/products', authMiddleware, tenantMiddleware, planGuard('product'), controller.create);
 *   router.post('/orders', authMiddleware, tenantMiddleware, planGuard('order'), controller.create);
 */
export const planGuard =
  (resourceType: 'product' | 'order') =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorId = req.vendorId;
      if (!vendorId) {
        return next(new AppError('Tenant context missing', 403, 'TENANT_FORBIDDEN'));
      }

      // Fetch vendor + their plan in one query
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        select: {
          trialEndsAt: true,
          plan: {
            select: { productLimit: true, orderLimitMonthly: true },
          },
        },
      });

      if (!vendor) {
        return next(new AppError('Vendor not found', 404, 'NOT_FOUND'));
      }

      // ── Trial expiry check ────────────────────────────────────────────────
      if (vendor.trialEndsAt && vendor.trialEndsAt < new Date()) {
        return next(
          new AppError(
            'Your trial has expired. Please upgrade to continue.',
            402,
            'TRIAL_EXPIRED',
          ),
        );
      }

      // ── Product limit check ───────────────────────────────────────────────
      if (resourceType === 'product' && vendor.plan?.productLimit) {
        const count = await prisma.product.count({
          where: { vendorId, deletedAt: null },
        });
        if (count >= vendor.plan.productLimit) {
          return next(
            new AppError(
              `Product limit of ${vendor.plan.productLimit} reached. Upgrade your plan.`,
              402,
              'PLAN_PRODUCT_LIMIT',
            ),
          );
        }
      }

      // ── Monthly order limit check ─────────────────────────────────────────
      if (resourceType === 'order' && vendor.plan?.orderLimitMonthly) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const count = await prisma.order.count({
          where: { vendorId, createdAt: { gte: startOfMonth } },
        });
        if (count >= vendor.plan.orderLimitMonthly) {
          return next(
            new AppError(
              `Monthly order limit of ${vendor.plan.orderLimitMonthly} reached. Upgrade your plan.`,
              402,
              'PLAN_ORDER_LIMIT',
            ),
          );
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
