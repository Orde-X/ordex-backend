"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// MUST be the very first import — validates all env vars before anything else
require("./core/config/env");
const prisma_client_1 = __importDefault(require("./core/database/prisma.client"));
const app_1 = __importDefault(require("./app"));
const logger_1 = require("./logger");
const env_1 = require("./core/config/env");
// ─── Bootstrap ────────────────────────────────────────────────────────────────
const startServer = async () => {
    try {
        await prisma_client_1.default.$connect();
        logger_1.logger.info('Database connected');
        // Skip port binding on Vercel (serverless — exports `app` instead)
        if (env_1.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
            const port = Number(env_1.env.PORT);
            app_1.default.listen(port, () => {
                logger_1.logger.info(`Server running on http://localhost:${port}`);
                logger_1.logger.info(`Swagger docs at http://localhost:${port}/api-docs`);
            });
        }
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger_1.logger.error({ err: error }, `Failed to start server: ${msg}`);
        if (env_1.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    }
};
// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = async (signal) => {
    logger_1.logger.info(`${signal} received — shutting down gracefully`);
    await prisma_client_1.default.$disconnect();
    logger_1.logger.info('Database disconnected');
    process.exit(0);
};
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
void startServer();
// Export app for Vercel serverless and supertest
exports.default = app_1.default;
