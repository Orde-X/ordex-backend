import { Request, Response } from 'express';
import prisma from '../../../core/database/prisma.client';
import asyncHandler from '../../../core/utils/asyncHandler';
import { sendSuccess } from '../../../core/utils/response';
import { AppError } from '../../../core/middlewares/error.middleware';
import { uploadImage } from '../../../core/utils/cloudinary.utils';
import { getRedisClient } from '../../../core/queue/redis.client';
import { 
  ProductCreateInput, 
  ProductUpdateInput, 
  VariantsUpsertInput,
  ProductPaginationInput 
} from './product.schema';

const redis = getRedisClient();

/**
 * Invalidate all storefront product cache for a specific vendor
 */
const invalidateStorefrontCache = async (vendorId: string) => {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { storeSlug: true },
  });
  if (vendor?.storeSlug) {
    const pattern = `storefront:${vendor.storeSlug}:products:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
};

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, productType, isActive } = req.query as unknown as ProductPaginationInput;
  const vendorId = req.vendorId!;

  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {
    vendorId,
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      { nameAr: { contains: search as string, mode: 'insensitive' } },
      { nameEn: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (productType) where.productType = productType;
  if (isActive !== undefined) where.isActive = isActive;

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { variants: true } },
      },
    }),
  ]);

  sendSuccess(res, products, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

/**
 * GET /api/v1/products/:id
 */
export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await prisma.product.findFirst({
    where: {
      id: req.params.id as string,
      vendorId: req.vendorId!,
      deletedAt: null,
    },
    include: {
      variants: true,
    },
  });

  if (!product) {
    throw new AppError('Product not found or access denied', 404);
  }

  sendSuccess(res, product);
});

/**
 * POST /api/v1/products
 * Create product with plan limit check (Transactional)
 */
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as ProductCreateInput;
  const vendorId = req.vendorId!;

  const newProduct = await prisma.$transaction(async (tx) => {
    // 1. Get vendor and their plan product limit
    const vendor = await tx.vendor.findUnique({
      where: { id: vendorId },
      include: { plan: true },
    });

    if (!vendor) throw new AppError('Vendor not found', 404);

    // 2. Count current active products
    const currentCount = await tx.product.count({
      where: { vendorId, deletedAt: null },
    });

    // 3. Enforce plan limit
    if (vendor.plan?.productLimit && currentCount >= vendor.plan.productLimit) {
      throw new AppError(
        `Product limit reached. Your current plan allows up to ${vendor.plan.productLimit} products.`,
        402,
        'PLAN_PRODUCT_LIMIT'
      );
    }

    // 4. Create the product
    return tx.product.create({
      data: {
        ...data,
        vendorId,
        basePrice: data.basePrice.toString(), // Prisma Decimal handling
      },
    });
  });

  // Invalidate cache
  await invalidateStorefrontCache(vendorId);

  sendSuccess(res, newProduct, {}, 201);
});

/**
 * PATCH /api/v1/products/:id
 */
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as ProductUpdateInput;
  const id = req.params.id as string;
  const vendorId = req.vendorId!;

  const product = await prisma.product.findFirst({
    where: { id, vendorId, deletedAt: null },
  });

  if (!product) throw new AppError('Product not found', 404);

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      basePrice: data.basePrice ? data.basePrice.toString() : undefined,
    },
  });

  await invalidateStorefrontCache(vendorId);

  sendSuccess(res, updatedProduct);
});

/**
 * DELETE /api/v1/products/:id
 * Soft delete handling
 */
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const vendorId = req.vendorId!;

  const product = await prisma.product.findFirst({
    where: { id, vendorId, deletedAt: null },
  });

  if (!product) throw new AppError('Product not found', 404);

  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await invalidateStorefrontCache(vendorId);

  sendSuccess(res, null, { message: 'Product deleted successfully' });
});

/**
 * PATCH /api/v1/products/:id/toggle
 */
export const toggleProductStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const vendorId = req.vendorId!;

  const product = await prisma.product.findFirst({
    where: { id, vendorId, deletedAt: null },
  });

  if (!product) throw new AppError('Product not found', 404);

  const updated = await prisma.product.update({
    where: { id },
    data: { isActive: !product.isActive },
  });

  await invalidateStorefrontCache(vendorId);

  sendSuccess(res, updated);
});

/**
 * POST /api/v1/products/:id/variants
 * Transactional variant matrix upsert
 */
export const upsertVariants = asyncHandler(async (req: Request, res: Response) => {
  const productId = req.params.id as string;
  const { variants } = req.body as VariantsUpsertInput;
  const vendorId = req.vendorId!;

  // Verify ownership
  const product = await prisma.product.findFirst({
    where: { id: productId, vendorId, deletedAt: null },
  });

  if (!product) throw new AppError('Product not found', 404);

  await prisma.$transaction(async (tx) => {
    // 1. Delete all existing variants for this product
    await tx.productVariant.deleteMany({
      where: { productId, vendorId },
    });

    // 2. Bulk insert new variants if any
    if (variants.length > 0) {
      await tx.productVariant.createMany({
        data: variants.map((v) => ({
          productId,
          vendorId,
          combination: v.combination,
          priceOverride: v.priceOverride ? v.priceOverride.toString() : null,
          stock: v.stock,
          sku: v.sku,
        })),
      });
    }
  });

  await invalidateStorefrontCache(vendorId);

  const updatedProduct = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: true },
  });

  sendSuccess(res, updatedProduct);
});

/**
 * POST /api/v1/products/:productId/upload-image
 * Standardised naming: vendors/{vId}/products/{pId}/{uuid}.webp
 */
export const uploadProductImage = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  const { productId } = req.params as { productId: string };
  const vendorId = req.vendorId!;

  if (!file) {
    throw new AppError('No image provided', 400);
  }

  // Verify ownership before upload
  const product = await prisma.product.findFirst({
    where: { id: productId, vendorId, deletedAt: null },
  });

  if (!product) throw new AppError('Product not found', 404);

  const cdnUrl = await uploadImage(file.buffer, vendorId, productId);

  // Update product image list
  const currentImages = (product.images as string[]) || [];
  const updatedImages = [...currentImages, cdnUrl];

  await prisma.product.update({
    where: { id: productId },
    data: { images: updatedImages },
  });

  await invalidateStorefrontCache(vendorId);

  sendSuccess(res, { url: cdnUrl, allImages: updatedImages });
});
