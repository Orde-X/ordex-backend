import { Router } from 'express';
import { signupBuyer, signupSupplier, login, verifyEmail, refreshToken, forgotPassword, verifySupplier } from './auth.controller';
import { isAuthenticated, checkRole } from './auth.middlewares';
import { UserRole } from '@prisma/client';
import { validateRequest } from '../../core/middlewares/validate.middleware';
import { buyerSignupSchema, supplierSignupSchema, loginSchema } from './auth.validation';

const router = Router();

router.post('/signup/buyer', validateRequest(buyerSignupSchema), signupBuyer);
router.post('/signup/supplier', validateRequest(supplierSignupSchema), signupSupplier);
router.post('/login', validateRequest(loginSchema), login);
router.get('/verify-email', verifyEmail);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);

// Admin / Supplier Verification
router.post('/verify-supplier/:supplierId', isAuthenticated, checkRole([UserRole.ADMIN]), verifySupplier);

export default router;
