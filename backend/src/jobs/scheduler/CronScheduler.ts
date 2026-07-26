import cron from 'node-cron';
import { IQueueService } from '../interfaces/IQueue';
import { JobType, JobPriority } from '../types';
import { logger } from '../../utils/logger';

export class CronScheduler {
  private tasks: cron.ScheduledTask[] = [];

  constructor(private queue: IQueueService) {}

  public start(): void {
    logger.info('[Scheduler] Starting cron jobs...');

    // Every 6 Hours: Incremental YouTube Sync
    this.schedule('0 */6 * * *', JobType.YOUTUBE_SYNC_INCREMENTAL, {}, JobPriority.MEDIUM);

    // Daily at Midnight: Search Index Refresh & Analytics Aggregation
    this.schedule('0 0 * * *', JobType.SEARCH_INDEX, {}, JobPriority.LOW);
    this.schedule('0 0 * * *', JobType.ANALYTICS_AGGREGATION, {}, JobPriority.LOW);
    this.schedule('0 0 * * *', JobType.COLLECTION_REFRESH, {}, JobPriority.LOW);

    // Weekly (Sunday Midnight): Cache Cleanup & Full Validation
    this.schedule('0 0 * * 0', JobType.CACHE_CLEANUP, {}, JobPriority.LOW);
    
    // Monthly (1st of Month): DB Backup
    this.schedule('0 0 1 * *', JobType.BACKUP, {}, JobPriority.LOW);
  }

  public stop(): void {
    this.tasks.forEach(task => task.stop());
    this.tasks = [];
    logger.info('[Scheduler] Stopped all cron jobs');
  }

  private schedule(cronExpression: string, jobType: JobType, payload: any, priority: JobPriority) {
    const task = cron.schedule(cronExpression, async () => {
      logger.info(`[Scheduler] Triggering scheduled job: ${jobType}`);
      try {
        await this.queue.enqueue(jobType, payload, priority);
      } catch (error) {
        logger.error(`[Scheduler] Failed to enqueue scheduled job: ${jobType}`, error);
      }
    });

    this.tasks.push(task);
  }
}
