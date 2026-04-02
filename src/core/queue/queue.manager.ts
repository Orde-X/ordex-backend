import { Queue, QueueOptions } from 'bullmq';

import { getRedisClient } from './redis.client';

// ─── Queue Names ──────────────────────────────────────────────────────────────

export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATIONS: 'notifications',
  ORDER_PROCESSING: 'order-processing',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// ─── Queue Registry ───────────────────────────────────────────────────────────

const queueRegistry = new Map<string, Queue>();

const defaultQueueOptions: Partial<QueueOptions> = {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
};

/**
 * Get or create a BullMQ Queue by name.
 * All queues share the same Redis connection.
 */
export const getQueue = (name: QueueName): Queue => {
  if (!queueRegistry.has(name)) {
    const queue = new Queue(name, {
      connection: getRedisClient(),
      ...defaultQueueOptions,
    });
    queueRegistry.set(name, queue);
    console.info(`📬  Queue registered: ${name}`);
  }

  return queueRegistry.get(name)!;
};

/**
 * Close all queues gracefully (call on app shutdown).
 */
export const closeAllQueues = async (): Promise<void> => {
  for (const [name, queue] of queueRegistry) {
    await queue.close();
    console.info(`Queue closed: ${name}`);
  }
  queueRegistry.clear();
};
