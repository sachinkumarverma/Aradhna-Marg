import { logger } from '../../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface IJobOptions {
  retryLimit?: number;
  retryDelayMs?: number;
}

export interface IJob<T = any> {
  id: string;
  type: string;
  payload: T;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  attempts: number;
  options: IJobOptions;
}

type JobHandler<T> = (payload: T) => Promise<void>;

/**
 * QueueManager (In-Memory Implementation)
 * Extensible to BullMQ / Redis in the future.
 */
class QueueManager {
  private queues: Map<string, IJob[]> = new Map();
  private handlers: Map<string, JobHandler<any>> = new Map();
  private isProcessing: Map<string, boolean> = new Map();

  public registerWorker<T>(queueName: string, handler: JobHandler<T>) {
    this.handlers.set(queueName, handler);
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
    }
    this.isProcessing.set(queueName, false);
    logger.info(`Registered background worker for queue: ${queueName}`);
  }

  public async enqueue<T>(queueName: string, payload: T, options: IJobOptions = { retryLimit: 3, retryDelayMs: 5000 }) {
    const job: IJob<T> = {
      id: uuidv4(),
      type: queueName,
      payload,
      status: 'PENDING',
      attempts: 0,
      options,
    };

    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
    }

    this.queues.get(queueName)!.push(job);
    logger.debug(`[ENQUEUED] Job ${job.id} to ${queueName}`);

    // Trigger processing asynchronously if not already running
    this.processQueue(queueName).catch(err => logger.error(`Queue error ${queueName}:`, err));
  }

  private async processQueue(queueName: string) {
    if (this.isProcessing.get(queueName)) return;
    this.isProcessing.set(queueName, true);

    const queue = this.queues.get(queueName);
    const handler = this.handlers.get(queueName);

    if (!queue || !handler) {
      this.isProcessing.set(queueName, false);
      return;
    }

    while (queue.some(j => j.status === 'PENDING')) {
      const jobIndex = queue.findIndex(j => j.status === 'PENDING');
      if (jobIndex === -1) break;

      const job = queue[jobIndex];
      job.status = 'PROCESSING';
      job.attempts += 1;

      try {
        await handler(job.payload);
        job.status = 'COMPLETED';
        logger.debug(`[JOB COMPLETED] ${job.id} in ${queueName}`);
        // Remove from queue in real scenario to prevent memory leak
        queue.splice(jobIndex, 1); 
      } catch (error) {
        logger.error(`[JOB FAILED] ${job.id} in ${queueName} (Attempt ${job.attempts})`, error);
        if (job.attempts < (job.options.retryLimit || 0)) {
          job.status = 'PENDING';
          // Wait before retry
          await new Promise(res => setTimeout(res, job.options.retryDelayMs));
        } else {
          job.status = 'FAILED';
          logger.error(`[JOB ABANDONED] ${job.id} exceeded retry limit.`);
        }
      }
    }

    this.isProcessing.set(queueName, false);
  }
}

export const queueManager = new QueueManager();
