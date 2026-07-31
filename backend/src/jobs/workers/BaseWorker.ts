import { IQueueService } from '@/jobs/interfaces/IQueue';
import { JobType, IJobPayload } from '@/jobs/types';
import { logger } from '@utils/logger';

export abstract class BaseWorker {
  protected isRunning: boolean = false;
  private workerInterval: NodeJS.Timeout | null = null;
  
  constructor(
    protected queue: IQueueService,
    protected jobType: JobType,
    protected pollIntervalMs: number = 5000
  ) {}

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info(`[Worker] Started polling for ${this.jobType}`);
    
    this.workerInterval = setInterval(() => this.poll(), this.pollIntervalMs);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = null;
    }
    logger.info(`[Worker] Stopped polling for ${this.jobType}`);
  }

  private async poll(): Promise<void> {
    try {
      const job = await this.queue.dequeue(this.jobType);
      if (!job) return; // No jobs available

      logger.info(`[Worker] Processing ${this.jobType} job: ${job.id}`);
      
      await this.processWithRetry(job);
      
    } catch (error) {
      logger.error({ error }, `[Worker] Uncaught Queue Exception`);
    }
  }

  // Wrapper for processing with Error boundaries
  protected async processWithRetry(job: IJobPayload): Promise<void> {
    try {
        await this.process(job);
        await this.queue.ack(job.id);
    } catch (error: any) {
        await this.queue.fail(job.id, error);
    }
  }

  /**
   * The actual business logic to implement per worker.
   */
  protected abstract process(job: IJobPayload): Promise<void>;
}
