/**
 * src/app.ts — Express application factory.
 *
 * Exports the configured Express `app` WITHOUT calling `app.listen()`.
 * This separation allows supertest to import `app` in tests without binding a port.
 * The actual HTTP server bootstrap lives in server.ts.
 */
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { allowedOrigins, env } from './core/config/env';
import { globalErrorHandler } from './core/middlewares/error.middleware';
import { notFoundHandler } from './core/middlewares/not-found.middleware';
import {
  authLimiter,
  generalLimiter,
  storefrontLimiter,
} from './core/middlewares/rate-limiter.middleware';
import { sendSuccess } from './core/utils/response';
import { logger } from './logger';
import v1Routes from './core/routes/v1';
import { setupSwagger } from './core/swagger';

const app = express();

// ─── 1. HTTP Request Logging (must be first) ──────────────────────────────────
app.use(
  pinoHttp({
    logger,
    quietReqLogger: true,
    customLogLevel: (_req, res) => {
      if (res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  }),
);

// ─── 2. Security Headers ──────────────────────────────────────────────────────
app.use(helmet());

// ─── 3. CORS ──────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  }),
);

// ─── 4. Body Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── 5. Health / root route ───────────────────────────────────────────────────
app.get('/', (_req, res) => {
  sendSuccess(res, {
    name: 'Orde-X Backend API',
    version: '1.0.0',
    status: 'running',
    environment: env.NODE_ENV,
  });
});

// ─── 6. API Routes ────────────────────────────────────────────────────────────
// Rate limiters are applied per route group as per sprint doc
app.use('/api/v1', generalLimiter, v1Routes);

// Swagger docs
setupSwagger(app);

// ─── 7. 404 + Global Error Handler (MUST be last) ────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Export for use in server.ts and supertest
export { authLimiter, storefrontLimiter };
export default app;
