import IORedis from 'ioredis';

import { env } from '../config/env';

// ─── Redis Client (shared singleton) ─────────────────────────────────────────

let redisClient: IORedis | null = null;

export const getRedisClient = (): IORedis => {
  if (!redisClient) {
    redisClient = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      console.info('Redis connected');
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err.message);
    });

    redisClient.on('close', () => {
      console.warn('Redis connection closed');
    });
  }

  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.info('Redis disconnected');
  }
};
