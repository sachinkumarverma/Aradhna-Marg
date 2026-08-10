"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseWorker = void 0;
const logger_1 = require("@utils/logger");
class BaseWorker {
    queue;
    jobType;
    pollIntervalMs;
    isRunning = false;
    workerInterval = null;
    constructor(queue, jobType, pollIntervalMs = 5000) {
        this.queue = queue;
        this.jobType = jobType;
        this.pollIntervalMs = pollIntervalMs;
    }
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        logger_1.logger.info(`[Worker] Started polling for ${this.jobType}`);
        this.workerInterval = setInterval(() => this.poll(), this.pollIntervalMs);
    }
    stop() {
        this.isRunning = false;
        if (this.workerInterval) {
            clearInterval(this.workerInterval);
            this.workerInterval = null;
        }
        logger_1.logger.info(`[Worker] Stopped polling for ${this.jobType}`);
    }
    async poll() {
        try {
            const job = await this.queue.dequeue(this.jobType);
            if (!job)
                return; // No jobs available
            logger_1.logger.info(`[Worker] Processing ${this.jobType} job: ${job.id}`);
            await this.processWithRetry(job);
        }
        catch (error) {
            logger_1.logger.error({ error }, `[Worker] Uncaught Queue Exception`);
        }
    }
    // Wrapper for processing with Error boundaries
    async processWithRetry(job) {
        try {
            await this.process(job);
            await this.queue.ack(job.id);
        }
        catch (error) {
            await this.queue.fail(job.id, error);
        }
    }
}
exports.BaseWorker = BaseWorker;
