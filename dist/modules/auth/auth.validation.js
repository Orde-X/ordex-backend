"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.supplierSignupSchema = exports.buyerSignupSchema = void 0;
const zod_1 = require("zod");
exports.buyerSignupSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters long'),
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
});
exports.supplierSignupSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters long'),
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    // Profile specific
    companyName: zod_1.z.string().min(1, 'Company name is required'),
    registrationNumber: zod_1.z.string().min(1, 'Registration number is required'),
    businessType: zod_1.z.string().min(1, 'Business type is required'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
