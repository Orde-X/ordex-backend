import { z } from 'zod';

const EGY_PHONE_REGEX = /^(\+20|0020|0)?1[0-2,5][0-9]{8}$/;
const SLUG_REGEX = /^[a-z0-9-]{3,50}$/;

const RESERVED_SLUGS = [
  'admin',
  'api',
  'www',
  'support',
  'login',
  'store',
  'auth',
  'dashboard',
];

export const vendorRegisterSchema = z.object({
  business_name_ar: z.string().min(1, 'Arabic business name is required'),
  business_name_en: z.string().optional(),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(EGY_PHONE_REGEX, 'Invalid Egyptian phone number format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  store_slug: z
    .string()
    .regex(SLUG_REGEX, 'Slug must be lowercase alphanumeric and hyphens only, 3-50 chars')
    .refine((slug) => !RESERVED_SLUGS.includes(slug), {
      message: 'This store slug is reserved',
    }),
});

export const vendorLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const vendorProfileUpdateSchema = z.object({
  business_name_ar: z.string().min(1, 'Arabic business name is required').optional(),
  business_name_en: z.string().optional(),
  logo_url: z.string().url('Must be a valid URL').optional(),
  banner_url: z.string().url('Must be a valid URL').optional(),
  settings: z.record(z.string(), z.any()).optional(),
});

export type VendorRegisterInput = z.infer<typeof vendorRegisterSchema>;
export type VendorLoginInput = z.infer<typeof vendorLoginSchema>;
export type VendorProfileUpdateInput = z.infer<typeof vendorProfileUpdateSchema>;
