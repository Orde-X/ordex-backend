import 'dotenv/config';
import { z } from 'zod';

// ─── Env Validation Schema ────────────────────────────────────────────────────
const envSchema = z.object({
  // Server
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Redis
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL').default('redis://localhost:6379'),

  // JWT — RS256 asymmetric keys (PEM format, \n for newlines in .env)
  JWT_PRIVATE_KEY: z.string().min(1, 'JWT_PRIVATE_KEY is required (RS256 PEM private key)'),
  JWT_PUBLIC_KEY: z.string().min(1, 'JWT_PUBLIC_KEY is required (RS256 PEM public key)'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Admin JWT — separate HS256 secret for admin panel
  ADMIN_JWT_SECRET: z.string().min(32, 'ADMIN_JWT_SECRET must be at least 32 characters'),

  // CORS — comma-separated origins
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),

  // Cloudinary Storage
  CLOUDINARY_URL: z.string().url('CLOUDINARY_URL must be a valid URL'),

  // SMTP
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

// ─── Development overrides — make keys optional locally ───────────────────
const devSchema = envSchema.extend({
  JWT_PRIVATE_KEY: z.string().default('dev_private_key_placeholder'),
  JWT_PUBLIC_KEY: z.string().default('dev_public_key_placeholder'),
  ADMIN_JWT_SECRET: z.string().min(32).default('dev_admin_secret_change_me_in_prod_32c'),
  CLOUDINARY_URL: z.string().default('cloudinary://dev:dev@dev'),
});

const isDev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging';
const schema = isDev ? devSchema : envSchema;

// ─── Parse & Validate ────────────────────────────────────────────────────────
const _parsed = schema.safeParse(process.env);

if (!_parsed.success) {
  console.error('Invalid environment variables:\n');
  _parsed.error.issues.forEach((issue) => {
    console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

// ─── Typed Env Export ────────────────────────────────────────────────────────
export const env = _parsed.data;

/** Parsed list of allowed CORS origins */
export const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
