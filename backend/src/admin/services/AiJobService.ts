import { AiJobRepository } from '../repositories/AiJobRepository';
import { CreateAiJobDTO, AiJob } from '../../models/AiJob';

export class AiJobService {
  private repository: AiJobRepository;

  constructor() {
    this.repository = new AiJobRepository();
  }

  async getJobs(options: { page?: number; limit?: number; status?: string }): Promise<{ data: AiJob[]; count: number }> {
    return await this.repository.findAll(options.page || 1, options.limit || 10, options.status);
  }
  
  async getStats(): Promise<any> {
    return await this.repository.getStats();
  }

  async queueJob(dto: CreateAiJobDTO): Promise<AiJob> {
    // In a real application, you would also enqueue this job to a message broker (e.g. RabbitMQ, Redis BullMQ, or Azure Service Bus)
    // The actual AI processor would pick it up and update the status in the DB as it progresses.
    return await this.repository.create(dto);
  }

  async retryJob(id: string): Promise<AiJob> {
    // Update status back to pending to be picked up by the worker
    return await this.repository.updateStatus(id, 'PENDING', null);
  }

  async cancelJob(id: string): Promise<AiJob> {
    // Note: If the job is already PROCESSING, cancellation might require signaling the worker.
    // For now, we just update the status to FAILED or CANCELLED in DB.
    return await this.repository.updateStatus(id, 'FAILED', 'Cancelled by user');
  }

  async deleteJob(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
