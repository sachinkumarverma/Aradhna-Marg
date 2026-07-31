"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryQueue = void 0;
const types_1 = require("../types");
const uuid_1 = require("uuid");
const logger_1 = require("../../utils/logger");
class MemoryQueue {
    jobs = new Map();
    deadLetterQueue = new Map();
    async enqueue(type, payload, priority = types_1.JobPriority.LOW) {
        const id = (0, uuid_1.v4)();
        const job = {
            id,
            type,
            payload,
            priority,
            retries: 0,
            maxRetries: 3,
            state: types_1.JobState.QUEUED,
            createdAt: new Date(),
        };
        this.jobs.set(id, job);
        logger_1.logger.info(`[Queue] Job Enqueued: ${type} [${id}]`);
        return id;
    }
    async dequeue(type) {
        const queuedJobs = Array.from(this.jobs.values())
            .filter(j => j.type === type && j.state === types_1.JobState.QUEUED)
            .sort((a, b) => a.priority - b.priority || a.createdAt.getTime() - b.createdAt.getTime());
        if (queuedJobs.length === 0)
            return null;
        const job = queuedJobs[0];
        job.state = types_1.JobState.RUNNING;
        job.startedAt = new Date();
        this.jobs.set(job.id, job);
        return job;
    }
    async ack(jobId) {
        const job = this.jobs.get(jobId);
        if (job) {
            job.state = types_1.JobState.COMPLETED;
            job.completedAt = new Date();
            this.jobs.set(jobId, job);
            // In a real memory queue, you might delete it to save RAM, 
            // or move it to an archive DB table.
            logger_1.logger.info(`[Queue] Job Completed: ${jobId}`);
        }
    }
    async fail(jobId, error) {
        const job = this.jobs.get(jobId);
        if (!job)
            return;
        job.error = error.message;
        job.stackTrace = error.stack;
        if (job.retries < job.maxRetries) {
            job.state = types_1.JobState.RETRYING;
            job.retries += 1;
            // Exponential backoff logic would be handled by the worker sleeping or rescheduling
            logger_1.logger.warn(`[Queue] Job Failed (Retrying ${job.retries}/${job.maxRetries}): ${jobId}`);
        }
        else {
            job.state = types_1.JobState.FAILED;
            this.deadLetterQueue.set(jobId, job);
            logger_1.logger.error({ error }, `[Queue] Job Moved to DLQ: ${jobId}`);
        }
        this.jobs.set(jobId, job);
    }
    async retry(jobId) {
        const job = this.jobs.get(jobId);
        if (job && (job.state === types_1.JobState.FAILED || job.state === types_1.JobState.RETRYING)) {
            job.state = types_1.JobState.QUEUED;
            this.jobs.set(jobId, job);
            this.deadLetterQueue.delete(jobId);
            logger_1.logger.info(`[Queue] Job Queued for Retry: ${jobId}`);
        }
    }
    async cancel(jobId) {
        const job = this.jobs.get(jobId);
        if (job) {
            job.state = types_1.JobState.CANCELLED;
            this.jobs.set(jobId, job);
            logger_1.logger.info(`[Queue] Job Cancelled: ${jobId}`);
        }
    }
    async getStats() {
        const jobsArr = Array.from(this.jobs.values());
        return {
            queued: jobsArr.filter(j => j.state === types_1.JobState.QUEUED).length,
            running: jobsArr.filter(j => j.state === types_1.JobState.RUNNING).length,
            failed: jobsArr.filter(j => j.state === types_1.JobState.FAILED).length,
        };
    }
}
exports.MemoryQueue = MemoryQueue;
