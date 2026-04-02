import { z } from 'zod';
import { buyerSignupSchema, supplierSignupSchema, loginSchema } from './auth.validation';

export type BuyerSignupInput = z.infer<typeof buyerSignupSchema>;
export type SupplierSignupInput = z.infer<typeof supplierSignupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
