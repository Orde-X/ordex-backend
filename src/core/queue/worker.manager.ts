import { Job, Processor, Worker, WorkerOptions } from 'bullmq';

import { getRedisClient } from './redis.client';
import { QueueName } from './queue.manager';

// ─── Worker Registry ──────────────────────────────────────────────────────────

const workerRegistry = new Map<string, Worker>();

/**
 * Create and register a BullMQ worker for a queue.
 *
 * @param queueName  - Name of the queue to consume from
 * @param processor  - Job handler function
 * @param options    - Optional BullMQ WorkerOptions overrides
 */
export const createWorker = <T = unknown, R = unknown>(
  queueName: QueueName,
  processor: Processor<T, R>,
  options?: Partial<WorkerOptions>,
): Worker<T, R> => {
  const worker = new Worker<T, R>(queueName, processor, {
    connection: getRedisClient(),
    concurrency: 5,
    ...options,
  });

  worker.on('completed', (job: Job<T, R>) => {
    console.info(`✅  Job completed: [${queueName}] ${job.id}`);
  });

  worker.on('failed', (job: Job<T, R> | undefined, err: Error) => {
    console.error(`❌  Job failed: [${queueName}] ${job?.id} — ${err.message}`);
  });

  workerRegistry.set(queueName, worker as Worker);
  return worker;
};

/**
 * Close all workers gracefully (call on app shutdown).
 */
export const closeAllWorkers = async (): Promise<void> => {
  for (const [name, worker] of workerRegistry) {
    await worker.close();
    console.info(`Worker closed: ${name}`);
  }
  workerRegistry.clear();
};
