import { Router } from 'express';
import { validateRequest } from '../../../core/middlewares/validate.middleware';
import { tenantMiddleware } from '../../../core/middlewares/tenant.middleware';
import { isAuthenticated } from '../../auth/auth.middlewares';
import { generalLimiter, orderLimiter } from '../../../core/middlewares/rate-limiter.middleware';
import { imageUpload } from '../../../core/utils/cloudinary.utils';
import { 
  productCreateSchema, 
  productUpdateSchema, 
  variantsUpsertSchema, 
  productPaginationSchema 
} from './product.schema';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  upsertVariants,
  uploadProductImage,
} from './product.controller';

const router = Router();

// Dashboard-only (Authenticated)
router.use(isAuthenticated);
router.use(tenantMiddleware);
router.use(generalLimiter);

/**
 * GET /api/v1/products - List products (Paginated)
 */
router.get('/', validateRequest(productPaginationSchema, 'query'), getProducts);

/**
 * POST /api/v1/products - Create product (Plan Limit check)
 */
router.post('/', validateRequest(productCreateSchema), createProduct);

/**
 * POST /api/v1/products/upload-image - Upload Image (Cloudinary Standardised naming)
 * MUST be before /:id for parameter precedence
 */
router.post('/upload-image/:productId', imageUpload.single('image'), uploadProductImage);

/**
 * GET /api/v1/products/:id - Product Detail
 */
router.get('/:id', getProduct);

/**
 * PATCH /api/v1/products/:id - Update product
 */
router.patch('/:id', validateRequest(productUpdateSchema), updateProduct);

/**
 * DELETE /api/v1/products/:id - Soft Delete
 */
router.delete('/:id', deleteProduct);

/**
 * PATCH /api/v1/products/:id/toggle - Toggle isActive
 */
router.patch('/:id/toggle', toggleProductStatus);

/**
 * POST /api/v1/products/:id/variants - Upsert variant matrix
 */
router.post('/:id/variants', validateRequest(variantsUpsertSchema), upsertVariants);

export default router;
