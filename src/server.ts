/**
 * src/server.ts — HTTP server entry point.
 *
 * Responsibilities:
 *  1. Validate env (imported first — crashes immediately on missing vars)
 *  2. Connect to database
 *  3. Call app.listen()
 *  4. Handle graceful shutdown
 *
 * Everything else (middleware, routes, error handlers) lives in app.ts.
 */

// MUST be the very first import — validates all env vars before anything else
import './core/config/env';

import prisma from './core/database/prisma.client';
import app from './app';
import { logger } from './logger';
import { env } from './core/config/env';

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    // Skip port binding on Vercel (serverless — exports `app` instead)
    if (env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      const port = Number(env.PORT);
      app.listen(port, () => {
        logger.info(`Server running on http://localhost:${port}`);
        logger.info(`Swagger docs at http://localhost:${port}/api-docs`);
      });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ err: error }, `Failed to start server: ${msg}`);
    if (env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

const shutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received — shutting down gracefully`);
  await prisma.$disconnect();
  logger.info('Database disconnected');
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

void startServer();

// Export app for Vercel serverless and supertest
export default app;
