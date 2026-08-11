"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiJobService = void 0;
const AiJobRepository_1 = require("../repositories/AiJobRepository");
class AiJobService {
    repository;
    constructor() {
        this.repository = new AiJobRepository_1.AiJobRepository();
    }
    async getJobs(options) {
        return await this.repository.findAll(options.page || 1, options.limit || 10, options.status);
    }
    async getStats() {
        return await this.repository.getStats();
    }
    async queueJob(dto) {
        // In a real application, you would also enqueue this job to a message broker (e.g. RabbitMQ, Redis BullMQ, or Azure Service Bus)
        // The actual AI processor would pick it up and update the status in the DB as it progresses.
        return await this.repository.create(dto);
    }
    async retryJob(id) {
        // Update status back to pending to be picked up by the worker
        return await this.repository.updateStatus(id, 'PENDING', undefined);
    }
    async cancelJob(id) {
        // Note: If the job is already PROCESSING, cancellation might require signaling the worker.
        // For now, we just update the status to FAILED or CANCELLED in DB.
        return await this.repository.updateStatus(id, 'FAILED', 'Cancelled by user');
    }
    async deleteJob(id) {
        await this.repository.delete(id);
    }
}
exports.AiJobService = AiJobService;
