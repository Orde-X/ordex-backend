import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { v4 as uuid } from 'uuid';

import { env } from '../config/env';

// ─── S3 Client (Cloudflare R2) ────────────────────────────────────────────────
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

// ─── Upload Config ────────────────────────────────────────────────────────────
const MAX_WIDTH = 800;
const WEBP_QUALITY = 80;

/**
 * Resize image with Sharp (max 800px wide, WebP 80% quality) and upload to R2.
 *
 * @param buffer   - Raw image buffer from multer memory storage
 * @param vendorId - Used as folder prefix for organisational namespacing
 * @returns        Public CDN URL of the uploaded image
 */
export const uploadImage = async (buffer: Buffer, vendorId: string): Promise<string> => {
  // Resize and convert to WebP
  const resized = await sharp(buffer)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  // Namespaced key: {vendorId}/{uuid}.webp
  const key = `${vendorId}/${uuid()}.webp`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: resized,
      ContentType: 'image/webp',
    }),
  );

  return `${env.R2_PUBLIC_URL}/${key}`;
};

/**
 * Delete an image from R2 by its full CDN URL.
 * Extracts the key by stripping the R2_PUBLIC_URL prefix.
 */
export const deleteImage = async (cdnUrl: string): Promise<void> => {
  const key = cdnUrl.replace(`${env.R2_PUBLIC_URL}/`, '');
  const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  await s3.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }));
};

// ─── Multer config (used in route files) ─────────────────────────────────────
import multer from 'multer';
import { AppError } from '../middlewares/error.middleware';

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new AppError('Invalid file type. Only JPEG, PNG, and WebP are allowed.', 415, 'IMAGE_TYPE_INVALID') as unknown as null, false);
    }
    cb(null, true);
  },
});
