import { Request, Response } from 'express';
import prisma from '../../../core/database/prisma.client';
import asyncHandler from '../../../core/utils/asyncHandler';
import { sendSuccess } from '../../../core/utils/response';
import { AppError } from '../../../core/middlewares/error.middleware';
import { getRedisClient } from '../../../core/queue/redis.client';
import { ProductPaginationInput } from '../vendor/product.schema';

const redis = getRedisClient();
const REDIS_TTL = 30; // 30 seconds as per specification

/**
 * GET /api/v1/storefront/:slug/products
 * Public consumer-facing product listing (Redis cached)
 */
export const getStorefrontProducts = asyncHandler(async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const { page, limit } = req.query as unknown as ProductPaginationInput;

  const cacheKey = `storefront:${slug}:products:p${page}:l${limit}`;

  // 1. Try Cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    const data = JSON.parse(cached);
    return sendSuccess(res, data.products, data.meta);
  }

  // 2. Database Query
  const vendor = await prisma.vendor.findUnique({
    where: { storeSlug: slug },
    select: { id: true },
  });

  if (!vendor) throw new AppError('Store not found', 404);

  const skip = (Number(page) - 1) * Number(limit);

  const [total, products] = await Promise.all([
    prisma.product.count({
      where: { vendorId: vendor.id, deletedAt: null, isActive: true },
    }),
    prisma.product.findMany({
      where: { vendorId: vendor.id, deletedAt: null, isActive: true },
      skip,
      take: Number(limit),
      orderBy: { sortOrder: 'asc' },
      include: {
        variants: {
          take: 1, // Preview first variant for price range if needed
        },
      },
    }),
  ]);

  const meta = {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  };

  // 3. Cache Result
  await redis.setex(cacheKey, REDIS_TTL, JSON.stringify({ products, meta }));

  sendSuccess(res, products, meta);
});

/**
 * GET /api/v1/storefront/:slug/products/:id
 */
export const getStorefrontProductDetail = asyncHandler(async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const id = req.params.id as string;

  const vendor = await prisma.vendor.findUnique({
    where: { storeSlug: slug },
    select: { id: true },
  });

  if (!vendor) throw new AppError('Store not found', 404);

  const product = await prisma.product.findFirst({
    where: {
      id,
      vendorId: vendor.id,
      deletedAt: null,
      isActive: true,
    },
    include: {
      variants: true,
    },
  });

  if (!product) throw new AppError('Product not found', 404);

  sendSuccess(res, product);
});
