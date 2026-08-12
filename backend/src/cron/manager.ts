import cron, { ScheduledTask } from 'node-cron';
import { logger } from '@utils/logger';

export interface ICronJob {
  name: string;
  description: string;
  schedule: string;
  run: () => Promise<void>;
  status: 'IDLE' | 'RUNNING' | 'FAILED';
  lastRun?: Date;
}

class CronManager {
  private jobs: Map<string, ICronJob> = new Map();
  private tasks: Map<string, ScheduledTask> = new Map();

  public register(job: ICronJob) {
    if (this.jobs.has(job.name)) {
      logger.warn(`Cron job ${job.name} is already registered.`);
      return;
    }

    this.jobs.set(job.name, job);

    const task = cron.schedule(
      job.schedule,
      async () => {
        const currentJob = this.jobs.get(job.name);
        if (!currentJob || currentJob.status === 'RUNNING') return;

        currentJob.status = 'RUNNING';
        currentJob.lastRun = new Date();
        logger.info(`Starting cron job: ${job.name}`);

        try {
          await currentJob.run();
          currentJob.status = 'IDLE';
          logger.info(`Successfully completed cron job: ${job.name}`);
        } catch (error) {
          currentJob.status = 'FAILED';
          logger.error({ error }, `Cron job ${job.name} failed`);
        }
      },
      { name: job.name }
    ); // node-cron v3 uses 'name' not 'scheduled'

    this.tasks.set(job.name, task);
    logger.info(`Registered cron job: ${job.name} with schedule: ${job.schedule}`);
  }

  public async runJob(name: string): Promise<void> {
    const job = this.jobs.get(name);
    if (!job) {
      throw new Error(`Cron job ${name} not found`);
    }
    if (job.status === 'RUNNING') {
      logger.warn(`Cron job ${name} is already running.`);
      return;
    }

    job.status = 'RUNNING';
    job.lastRun = new Date();
    logger.info(`Manually triggering cron job: ${job.name}`);

    try {
      await job.run();
      job.status = 'IDLE';
      logger.info(`Successfully completed manual run for: ${job.name}`);
    } catch (error) {
      job.status = 'FAILED';
      logger.error({ error }, `Manual run for ${job.name} failed`);
      throw error;
    }
  }

  public startAll() {
    this.tasks.forEach((task) => task.start());
    logger.info('All cron jobs started.');
  }

  public stopAll() {
    this.tasks.forEach((task) => task.stop());
    logger.info('All cron jobs stopped.');
  }
}

export const cronManager = new CronManager();
