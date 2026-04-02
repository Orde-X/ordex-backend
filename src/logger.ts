import pino from 'pino';
import { env } from './core/config/env';

/**
 * Shared Pino logger instance.
 * Exported here so both app.ts and server.ts use the same logger.
 */
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});
