"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_middlewares_1 = require("./auth.middlewares");
const client_1 = require("@prisma/client");
const validate_middleware_1 = require("../../core/middlewares/validate.middleware");
const auth_validation_1 = require("./auth.validation");
const router = (0, express_1.Router)();
router.post('/signup/buyer', (0, validate_middleware_1.validateRequest)(auth_validation_1.buyerSignupSchema), auth_controller_1.signupBuyer);
router.post('/signup/supplier', (0, validate_middleware_1.validateRequest)(auth_validation_1.supplierSignupSchema), auth_controller_1.signupSupplier);
router.post('/login', (0, validate_middleware_1.validateRequest)(auth_validation_1.loginSchema), auth_controller_1.login);
router.get('/verify-email', auth_controller_1.verifyEmail);
router.post('/refresh-token', auth_controller_1.refreshToken);
router.post('/forgot-password', auth_controller_1.forgotPassword);
// Admin / Supplier Verification
router.post('/verify-supplier/:supplierId', auth_middlewares_1.isAuthenticated, (0, auth_middlewares_1.checkRole)([client_1.UserRole.ADMIN]), auth_controller_1.verifySupplier);
exports.default = router;
