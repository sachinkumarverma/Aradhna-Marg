import { IJobPayload, JobType } from '../types';

export interface IQueueService {
  enqueue(type: JobType, payload: any, priority?: number): Promise<string>;
  dequeue(type: JobType): Promise<IJobPayload | null>;
  ack(jobId: string): Promise<void>;
  fail(jobId: string, error: Error): Promise<void>;
  retry(jobId: string): Promise<void>;
  cancel(jobId: string): Promise<void>;
  getStats(): Promise<{ queued: number; running: number; failed: number }>;
}
