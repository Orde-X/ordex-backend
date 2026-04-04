import { Router } from 'express';

import { authLimiter, orderLimiter, storefrontLimiter } from '../../middlewares/rate-limiter.middleware';
import { adminAuthMiddleware } from '../../middlewares/admin-auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { planGuard } from '../../middlewares/plan-guard.middleware';
import authRoutes from '../../../modules/auth/buyer/auth.routes';
import vendorAuthRoutes from '../../../modules/auth/vendor/vendor-auth.routes';

// ─── Placeholder routers (wired in as sprints complete) ───────────────────────
// Uncomment each line as the module is built in later sprints
import productsRouter from '../../../modules/product/vendor/product.routes';
// import customersRouter from '../../../modules/customers/customers.routes';
// import ordersRouter from '../../../modules/orders/orders.routes';
// import deliveryZonesRouter from '../../../modules/delivery-zones/delivery-zones.routes';
// import analyticsRouter from '../../../modules/analytics/analytics.routes';
import storefrontRouter from '../../../modules/product/storefront/storefront.routes';
// import adminRouter from '../../../modules/admin/admin.routes';

const router = Router();

// ─── [PUBLIC] Auth routes ─────────────────────────────────────────────────────
router.use('/auth', authLimiter, authRoutes);
router.use('/auth', authLimiter, vendorAuthRoutes);

// ─── [PUBLIC] Storefront routes ───────────────────────────────────────────────
router.use('/storefront', storefrontRouter);

// ─── [VENDOR JWT] Products ───────────────────────────────────────────────────
router.use('/products', productsRouter);

// ─── [VENDOR JWT] Orders ─────────────────────────────────────────────────────
// router.use('/orders', tenantMiddleware, orderLimiter, planGuard('order'), ordersRouter);

// ─── [VENDOR JWT] Customers ──────────────────────────────────────────────────
// router.use('/customers', tenantMiddleware, customersRouter);

// ─── [VENDOR JWT] Delivery Zones ─────────────────────────────────────────────
// router.use('/delivery-zones', tenantMiddleware, deliveryZonesRouter);

// ─── [VENDOR JWT] Analytics ──────────────────────────────────────────────────
// router.use('/analytics', tenantMiddleware, analyticsRouter);

// ─── [ADMIN] Admin panel ─────────────────────────────────────────────────────
// router.use('/admin', adminAuthMiddleware, adminRouter);

export default router;

// Keep these in scope so tree-shaking doesn't remove them
void [authLimiter, orderLimiter, storefrontLimiter, adminAuthMiddleware, tenantMiddleware, planGuard];