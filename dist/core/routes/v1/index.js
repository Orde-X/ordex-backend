"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rate_limiter_middleware_1 = require("../../middlewares/rate-limiter.middleware");
const admin_auth_middleware_1 = require("../../middlewares/admin-auth.middleware");
const tenant_middleware_1 = require("../../middlewares/tenant.middleware");
const plan_guard_middleware_1 = require("../../middlewares/plan-guard.middleware");
const auth_routes_1 = __importDefault(require("../../../modules/auth/auth.routes"));
// ─── Placeholder routers (wired in as sprints complete) ───────────────────────
// Uncomment each line as the module is built in later sprints
// import productsRouter from '../../../modules/products/products.routes';
// import customersRouter from '../../../modules/customers/customers.routes';
// import ordersRouter from '../../../modules/orders/orders.routes';
// import deliveryZonesRouter from '../../../modules/delivery-zones/delivery-zones.routes';
// import analyticsRouter from '../../../modules/analytics/analytics.routes';
// import storefrontRouter from '../../../modules/storefront/storefront.routes';
// import adminRouter from '../../../modules/admin/admin.routes';
const router = (0, express_1.Router)();
// ─── [PUBLIC] Auth routes ─────────────────────────────────────────────────────
router.use('/auth', rate_limiter_middleware_1.authLimiter, auth_routes_1.default);
// ─── [PUBLIC] Storefront routes ───────────────────────────────────────────────
// router.use('/storefront', storefrontLimiter, storefrontRouter);
// ─── [VENDOR JWT] Products ───────────────────────────────────────────────────
// router.use('/products', tenantMiddleware, planGuard('product'), productsRouter);
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
exports.default = router;
// Keep these in scope so tree-shaking doesn't remove them
void [rate_limiter_middleware_1.authLimiter, rate_limiter_middleware_1.orderLimiter, rate_limiter_middleware_1.storefrontLimiter, admin_auth_middleware_1.adminAuthMiddleware, tenant_middleware_1.tenantMiddleware, plan_guard_middleware_1.planGuard];
