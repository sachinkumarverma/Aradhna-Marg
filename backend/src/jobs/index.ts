import { MemoryQueue } from './queues/MemoryQueue';
import { CronScheduler } from './scheduler/CronScheduler';
import { YouTubeWorker } from './workers/YouTubeWorker';
import { AIWorker } from './workers/AIWorker';
import { eventBus } from './events/EventBus';
import { JobType, PlatformEvent, JobPriority } from './types';
import { logger } from '@utils/logger';

export class BackgroundJobSystem {
  private queue = new MemoryQueue();
  private scheduler = new CronScheduler(this.queue);
  private workers: any[] = [];

  public start() {
    logger.info('[JobSystem] Initializing Background Job System...');

    // 1. Initialize Workers
    this.workers = [
      new YouTubeWorker(this.queue),
      new AIWorker(this.queue)
      // SEO, PDF, Cache workers would be instantiated here
    ];

    // Start polling
    this.workers.forEach((worker) => worker.start());

    // 2. Start Cron Scheduler
    this.scheduler.start();

    // 3. Configure Event Bus Subscriptions (The Decoupled Architecture)

    // When a video is imported, queue AI processing
    eventBus.subscribe(PlatformEvent.VIDEO_IMPORTED, async (payload) => {
      logger.info(`[EventBus] Reaction: Queuing AI Processing for ${payload.videoId}`);
      await this.queue.enqueue(JobType.AI_PROCESSING, payload, JobPriority.HIGH);
    });

    // When AI completes, queue SEO Generation
    eventBus.subscribe(PlatformEvent.AI_COMPLETED, async (payload) => {
      logger.info(`[EventBus] Reaction: Queuing SEO Generation for ${payload.videoId}`);
      await this.queue.enqueue(JobType.SEO_GENERATION, payload, JobPriority.HIGH);
    });

    // When SEO completes, queue PDF Generation
    eventBus.subscribe(PlatformEvent.SEO_GENERATED, async (payload) => {
      logger.info(`[EventBus] Reaction: Queuing PDF Generation for ${payload.videoId}`);
      await this.queue.enqueue(JobType.PDF_GENERATION, payload, JobPriority.MEDIUM);
    });

    // When PDF completes, trigger Search Re-index and Cache invalidation
    eventBus.subscribe(PlatformEvent.PDF_GENERATED, async (payload) => {
      logger.info(`[EventBus] Reaction: Queuing Search Index update for ${payload.videoId}`);
      await this.queue.enqueue(JobType.SEARCH_INDEX, payload, JobPriority.MEDIUM);
      // Invalidate Cache for this specific bhajan
    });
  }

  public stop() {
    this.scheduler.stop();
    this.workers.forEach((worker) => worker.stop());
    logger.info('[JobSystem] Gracefully stopped.');
  }

  // Expose queue for manual API triggers (Admin Panel)
  public getQueue() {
    return this.queue;
  }
}

export const jobSystem = new BackgroundJobSystem();
