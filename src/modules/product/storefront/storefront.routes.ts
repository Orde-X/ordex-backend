import { Router } from 'express';
import { validateRequest } from '../../../core/middlewares/validate.middleware';
import { storefrontLimiter } from '../../../core/middlewares/rate-limiter.middleware';
import { productPaginationSchema } from '../vendor/product.schema';
import { getStorefrontProducts, getStorefrontProductDetail } from './storefront.controller';

const router = Router();

// Storefront-only (Public)
router.use(storefrontLimiter);

/**
 * GET /api/v1/storefront/:slug/products - List products (Redis Cached)
 */
router.get('/:slug/products', validateRequest(productPaginationSchema, 'query'), getStorefrontProducts);

/**
 * GET /api/v1/storefront/:slug/products/:id - Detailed Product View
 */
router.get('/:slug/products/:id', getStorefrontProductDetail);

export default router;
