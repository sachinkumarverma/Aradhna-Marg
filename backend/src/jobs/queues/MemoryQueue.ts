import { IQueueService } from '@/jobs/interfaces/IQueue';
import { IJobPayload, JobType, JobState, JobPriority } from '@/jobs/types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@utils/logger';

export class MemoryQueue implements IQueueService {
  private jobs: Map<string, IJobPayload> = new Map();
  private deadLetterQueue: Map<string, IJobPayload> = new Map();

  public async enqueue(type: JobType, payload: any, priority: JobPriority = JobPriority.LOW): Promise<string> {
    const id = uuidv4();
    const job: IJobPayload = {
      id,
      type,
      payload,
      priority,
      retries: 0,
      maxRetries: 3,
      state: JobState.QUEUED,
      createdAt: new Date()
    };

    this.jobs.set(id, job);
    logger.info(`[Queue] Job Enqueued: ${type} [${id}]`);
    return id;
  }

  public async dequeue(type: JobType): Promise<IJobPayload | null> {
    const queuedJobs = Array.from(this.jobs.values())
      .filter((j) => j.type === type && j.state === JobState.QUEUED)
      .sort((a, b) => a.priority - b.priority || a.createdAt.getTime() - b.createdAt.getTime());

    if (queuedJobs.length === 0) return null;

    const job = queuedJobs[0];
    job.state = JobState.RUNNING;
    job.startedAt = new Date();
    this.jobs.set(job.id, job);

    return job;
  }

  public async ack(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      job.state = JobState.COMPLETED;
      job.completedAt = new Date();
      this.jobs.set(jobId, job);
      // In a real memory queue, you might delete it to save RAM,
      // or move it to an archive DB table.
      logger.info(`[Queue] Job Completed: ${jobId}`);
    }
  }

  public async fail(jobId: string, error: Error): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.error = error.message;
    job.stackTrace = error.stack;

    if (job.retries < job.maxRetries) {
      job.state = JobState.RETRYING;
      job.retries += 1;
      // Exponential backoff logic would be handled by the worker sleeping or rescheduling
      logger.warn(`[Queue] Job Failed (Retrying ${job.retries}/${job.maxRetries}): ${jobId}`);
    } else {
      job.state = JobState.FAILED;
      this.deadLetterQueue.set(jobId, job);
      logger.error({ error }, `[Queue] Job Moved to DLQ: ${jobId}`);
    }

    this.jobs.set(jobId, job);
  }

  public async retry(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job && (job.state === JobState.FAILED || job.state === JobState.RETRYING)) {
      job.state = JobState.QUEUED;
      this.jobs.set(jobId, job);
      this.deadLetterQueue.delete(jobId);
      logger.info(`[Queue] Job Queued for Retry: ${jobId}`);
    }
  }

  public async cancel(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      job.state = JobState.CANCELLED;
      this.jobs.set(jobId, job);
      logger.info(`[Queue] Job Cancelled: ${jobId}`);
    }
  }

  public async getStats(): Promise<{ queued: number; running: number; failed: number }> {
    const jobsArr = Array.from(this.jobs.values());
    return {
      queued: jobsArr.filter((j) => j.state === JobState.QUEUED).length,
      running: jobsArr.filter((j) => j.state === JobState.RUNNING).length,
      failed: jobsArr.filter((j) => j.state === JobState.FAILED).length
    };
  }
}
