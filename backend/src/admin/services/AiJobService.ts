import { AiJobRepository } from '@admin/repositories/AiJobRepository';
import { CreateAiJobDTO, AiJob } from '@models/AiJob';
import { aiWorker } from './ai/AiWorker';

export class AiJobService {
  private repository: AiJobRepository;

  constructor() {
    this.repository = new AiJobRepository();
  }

  async getJobs(options: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ data: AiJob[]; count: number }> {
    return await this.repository.findAll(options.page || 1, options.limit || 10, options.status);
  }

  async getStats(): Promise<any> {
    return await this.repository.getStats();
  }

  async getBulkCounts(): Promise<{ bulkSeo: number; bulkExcerpt: number; bulkFestival: number }> {
    return await this.repository.getBulkCounts();
  }

  async queueJob(dto: CreateAiJobDTO): Promise<AiJob> {
    const job = await this.repository.create(dto);
    // Trigger worker asynchronously to start processing immediately
    setImmediate(() => {
      aiWorker.triggerWorker().catch(() => {});
    });
    return job;
  }

  async retryJob(id: string): Promise<AiJob> {
    const job = await this.repository.resetForRetry(id);
    setImmediate(() => {
      aiWorker.triggerWorker().catch(() => {});
    });
    return job;
  }

  async cancelJob(id: string): Promise<AiJob> {
    return await this.repository.updateStatus(id, 'FAILED', 'Cancelled by user');
  }

  async deleteJob(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}

export const aiJobService = new AiJobService();
