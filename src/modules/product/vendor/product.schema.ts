import { z } from 'zod';
import { ProductType } from '@prisma/client';

export const productCreateSchema = z.object({
  nameAr: z.string().min(1, 'Arabic name is required').max(300),
  nameEn: z.string().max(300).optional().nullable(),
  descriptionAr: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  productType: z.nativeEnum(ProductType).default(ProductType.standard),
  basePrice: z.coerce.number().min(0, 'Price cannot be negative'),
  images: z.array(z.string().url()).optional().default([]),
  customFields: z.record(z.string(), z.any()).optional().default({}),
  isActive: z.boolean().optional().default(true),
});

export const productUpdateSchema = productCreateSchema.partial();

export const variantItemSchema = z.object({
  combination: z.record(z.string(), z.string()), // e.g. { size: "L", color: "red" }
  priceOverride: z.coerce.number().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0).optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
});

export const variantsUpsertSchema = z.object({
  variants: z.array(variantItemSchema),
});

export const productPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20), // Max 50 enforced
  search: z.string().optional(),
  productType: z.nativeEnum(ProductType).optional(),
  isActive: z.coerce.string().transform((v) => v === 'true').optional(),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type VariantsUpsertInput = z.infer<typeof variantsUpsertSchema>;
export type ProductPaginationInput = z.infer<typeof productPaginationSchema>;
