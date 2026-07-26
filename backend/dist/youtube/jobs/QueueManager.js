"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueManager = void 0;
const logger_1 = require("../../utils/logger");
const uuid_1 = require("uuid");
/**
 * QueueManager (In-Memory Implementation)
 * Extensible to BullMQ / Redis in the future.
 */
class QueueManager {
    queues = new Map();
    handlers = new Map();
    isProcessing = new Map();
    registerWorker(queueName, handler) {
        this.handlers.set(queueName, handler);
        if (!this.queues.has(queueName)) {
            this.queues.set(queueName, []);
        }
        this.isProcessing.set(queueName, false);
        logger_1.logger.info(`Registered background worker for queue: ${queueName}`);
    }
    async enqueue(queueName, payload, options = { retryLimit: 3, retryDelayMs: 5000 }) {
        const job = {
            id: (0, uuid_1.v4)(),
            type: queueName,
            payload,
            status: 'PENDING',
            attempts: 0,
            options,
        };
        if (!this.queues.has(queueName)) {
            this.queues.set(queueName, []);
        }
        this.queues.get(queueName).push(job);
        logger_1.logger.debug(`[ENQUEUED] Job ${job.id} to ${queueName}`);
        // Trigger processing asynchronously if not already running
        this.processQueue(queueName).catch(err => logger_1.logger.error(`Queue error ${queueName}:`, err));
    }
    async processQueue(queueName) {
        if (this.isProcessing.get(queueName))
            return;
        this.isProcessing.set(queueName, true);
        const queue = this.queues.get(queueName);
        const handler = this.handlers.get(queueName);
        if (!queue || !handler) {
            this.isProcessing.set(queueName, false);
            return;
        }
        while (queue.some(j => j.status === 'PENDING')) {
            const jobIndex = queue.findIndex(j => j.status === 'PENDING');
            if (jobIndex === -1)
                break;
            const job = queue[jobIndex];
            job.status = 'PROCESSING';
            job.attempts += 1;
            try {
                await handler(job.payload);
                job.status = 'COMPLETED';
                logger_1.logger.debug(`[JOB COMPLETED] ${job.id} in ${queueName}`);
                // Remove from queue in real scenario to prevent memory leak
                queue.splice(jobIndex, 1);
            }
            catch (error) {
                logger_1.logger.error(`[JOB FAILED] ${job.id} in ${queueName} (Attempt ${job.attempts})`, error);
                if (job.attempts < (job.options.retryLimit || 0)) {
                    job.status = 'PENDING';
                    // Wait before retry
                    await new Promise(res => setTimeout(res, job.options.retryDelayMs));
                }
                else {
                    job.status = 'FAILED';
                    logger_1.logger.error(`[JOB ABANDONED] ${job.id} exceeded retry limit.`);
                }
            }
        }
        this.isProcessing.set(queueName, false);
    }
}
exports.queueManager = new QueueManager();
