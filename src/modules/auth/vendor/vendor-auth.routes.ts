import { Router } from 'express';
import { validateRequest } from '../../../core/middlewares/validate.middleware';
import { tenantMiddleware } from '../../../core/middlewares/tenant.middleware';
import asyncHandler from '../../../core/utils/asyncHandler';
import { isAuthenticated } from '../auth.middlewares';
import {
  registerVendor,
  loginVendor,
  refreshVendorToken,
  logoutVendor,
  getMe,
  updateVendorProfile,
} from './vendor-auth.controller';
import {
  vendorRegisterSchema,
  vendorLoginSchema,
  vendorProfileUpdateSchema,
} from './vendor-auth.schema';

const router = Router();

// Public routes
router.post('/register', validateRequest(vendorRegisterSchema), asyncHandler(registerVendor));
router.post('/login', validateRequest(vendorLoginSchema), asyncHandler(loginVendor));
router.post('/refresh', asyncHandler(refreshVendorToken));

// Authenticated Vendor routes
router.post('/logout', isAuthenticated, tenantMiddleware, asyncHandler(logoutVendor));
router.get('/me', isAuthenticated, tenantMiddleware, asyncHandler(getMe));
router.patch(
  '/profile',
  isAuthenticated,
  tenantMiddleware,
  validateRequest(vendorProfileUpdateSchema),
  asyncHandler(updateVendorProfile)
);

export default router;
