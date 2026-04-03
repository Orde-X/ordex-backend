import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

import { sendError } from '../utils/response';

// ─── Envelope-formatted rate limit response ───────────────────────────────────
const rateLimitResponse = (message: string, code: string) => ({
  data: null,
  meta: {},
  error: { code, message },
});

// ─── Auth limiter — strict (5 req / min) ─────────────────────────────────────
/**
 * Applied to: POST /auth/register, POST /auth/login
 * Prevents brute-force credential attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req),
  handler: (_req, res) => {
    res.status(429).json(
      rateLimitResponse('Too many attempts, please try again in 1 minute.', 'RATE_LIMITED'),
    );
  },
});

// ─── Order limiter — per vendor (60 req / min) ───────────────────────────────
/**
 * Applied to: POST /orders, POST /storefront/:slug/orders
 * Keyed by vendorId when authenticated, falls back to IP.
 */
export const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => {
    if (req.vendorId) {
      return `vendor-${req.vendorId}`;
    }
    return ipKeyGenerator(req);
  },
  handler: (_req, res) => {
    res.status(429).json(
      rateLimitResponse('Order rate limit exceeded.', 'RATE_LIMITED')
    );
  },
});

// ─── General limiter — per vendor (300 req / min) ────────────────────────────
/**
 * Applied on all other authenticated vendor routes.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  keyGenerator: (req) => {
    if (req.vendorId) {
      return `vendor-${req.vendorId}`;
    }
    return ipKeyGenerator(req);
  },
  handler: (_req, res) => {
    res.status(429).json(
      rateLimitResponse('Rate limit exceeded, slow down.', 'RATE_LIMITED')
    );
  },
});

// ─── Public storefront limiter — per IP (120 req / min) ──────────────────────
/**
 * Applied to all /storefront/* public routes.
 */
export const storefrontLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  keyGenerator: (req) => ipKeyGenerator(req),
  handler: (_req, res) => {
    res.status(429).json(rateLimitResponse('Too many requests.', 'RATE_LIMITED'));
  },
});

// suppress unused import warning — sendError used by consumers of this module
void sendError;
