// ─── Load & validate env FIRST — before any other imports ───────────────────
import './core/config/env';

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';

import { allowedOrigins, env } from './core/config/env';
import { globalErrorHandler } from './core/middlewares/error.middleware';
import { notFoundHandler } from './core/middlewares/not-found.middleware';
import prisma from './core/database/prisma.client';
import v1Routes from './core/routes/v1';
import { setupSwagger } from './core/swagger';

// ─── Logger ───────────────────────────────────────────────────────────────────

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});

// ─── App Setup ────────────────────────────────────────────────────────────────

const app = express();

// Security headers
app.use(helmet());

// CORS — restricted to explicit allow-list
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman, same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      }
    },
    credentials: true,
  }),
);

// Request body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logging (Pino)
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

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.json({
    data: {
      name: 'Orde-X Backend API',
      version: '1.0.0',
      status: 'running',
      environment: env.NODE_ENV,
    },
    meta: {},
    error: null,
  });
});

app.use('/api/v1', v1Routes);
setupSwagger(app);

// ─── Error Handling (must come after routes) ──────────────────────────────────

app.use(notFoundHandler);
app.use(globalErrorHandler);

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    // Only bind to a port when not running on Vercel serverless
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

export default app;
