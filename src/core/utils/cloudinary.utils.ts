import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import { AppError } from '../middlewares/error.middleware';
import { env } from '../config/env';

// ─── Initialise Cloudinary ───────────────────────────────────────────────────
// The SDK automatically pulls from process.env.CLOUDINARY_URL
cloudinary.config();

/**
 * Uploads an image buffer to Cloudinary with strict transformations and hierarchical naming.
 * Hierarchical naming: vendors/{vendorId}/products/{productId}/{uuid}
 * 
 * @param buffer    - Raw image buffer from multer memory storage
 * @param vendorId  - Vendor unique ID for multi-tenant scoping
 * @param productId - Product unique ID for folder organisation
 * @returns         Public CDN URL of the uploaded image
 */
export const uploadImage = async (
  buffer: Buffer,
  vendorId: string,
  productId: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        // Hierarchical naming strategy
        folder: `vendors/${vendorId}/products/${productId}`,
        public_id: uuid(),
        
        // Strict transformation rules
        transformation: [
          { width: 800, crop: 'limit' },
          { quality: 'auto', fetch_format: 'webp' },
        ],
        
        // Metadata
        tags: ['product-image', `vendor-${vendorId}`, `product-${productId}`],
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(new AppError('Cloudinary upload failed', 500, 'UPLOAD_FAILED'));
        }
        if (!result) {
          return reject(new AppError('Cloudinary upload returned no result', 500, 'UPLOAD_FAILED'));
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Optional: Delete image from Cloudinary (using public_id or URL parsing)
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

// ─── Multer middleware — memory storage with strict constraints ───────────────
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB strict limit per requirement
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new AppError(
          'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
          415,
          'IMAGE_TYPE_INVALID'
        ) as unknown as null,
        false
      );
    }
    cb(null, true);
  },
});
