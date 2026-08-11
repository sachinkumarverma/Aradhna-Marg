"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobSystem = exports.BackgroundJobSystem = void 0;
const MemoryQueue_1 = require("./queues/MemoryQueue");
const CronScheduler_1 = require("./scheduler/CronScheduler");
const YouTubeWorker_1 = require("./workers/YouTubeWorker");
const AIWorker_1 = require("./workers/AIWorker");
const EventBus_1 = require("./events/EventBus");
const types_1 = require("./types");
const logger_1 = require("../utils/logger");
class BackgroundJobSystem {
    queue = new MemoryQueue_1.MemoryQueue();
    scheduler = new CronScheduler_1.CronScheduler(this.queue);
    workers = [];
    start() {
        logger_1.logger.info('[JobSystem] Initializing Background Job System...');
        // 1. Initialize Workers
        this.workers = [
            new YouTubeWorker_1.YouTubeWorker(this.queue),
            new AIWorker_1.AIWorker(this.queue)
            // SEO, PDF, Cache workers would be instantiated here
        ];
        // Start polling
        this.workers.forEach(worker => worker.start());
        // 2. Start Cron Scheduler
        this.scheduler.start();
        // 3. Configure Event Bus Subscriptions (The Decoupled Architecture)
        // When a video is imported, queue AI processing
        EventBus_1.eventBus.subscribe(types_1.PlatformEvent.VIDEO_IMPORTED, async (payload) => {
            logger_1.logger.info(`[EventBus] Reaction: Queuing AI Processing for ${payload.videoId}`);
            await this.queue.enqueue(types_1.JobType.AI_PROCESSING, payload, types_1.JobPriority.HIGH);
        });
        // When AI completes, queue SEO Generation
        EventBus_1.eventBus.subscribe(types_1.PlatformEvent.AI_COMPLETED, async (payload) => {
            logger_1.logger.info(`[EventBus] Reaction: Queuing SEO Generation for ${payload.videoId}`);
            await this.queue.enqueue(types_1.JobType.SEO_GENERATION, payload, types_1.JobPriority.HIGH);
        });
        // When SEO completes, queue PDF Generation
        EventBus_1.eventBus.subscribe(types_1.PlatformEvent.SEO_GENERATED, async (payload) => {
            logger_1.logger.info(`[EventBus] Reaction: Queuing PDF Generation for ${payload.videoId}`);
            await this.queue.enqueue(types_1.JobType.PDF_GENERATION, payload, types_1.JobPriority.MEDIUM);
        });
        // When PDF completes, trigger Search Re-index and Cache invalidation
        EventBus_1.eventBus.subscribe(types_1.PlatformEvent.PDF_GENERATED, async (payload) => {
            logger_1.logger.info(`[EventBus] Reaction: Queuing Search Index update for ${payload.videoId}`);
            await this.queue.enqueue(types_1.JobType.SEARCH_INDEX, payload, types_1.JobPriority.MEDIUM);
            // Invalidate Cache for this specific bhajan
        });
    }
    stop() {
        this.scheduler.stop();
        this.workers.forEach(worker => worker.stop());
        logger_1.logger.info('[JobSystem] Gracefully stopped.');
    }
    // Expose queue for manual API triggers (Admin Panel)
    getQueue() {
        return this.queue;
    }
}
exports.BackgroundJobSystem = BackgroundJobSystem;
exports.jobSystem = new BackgroundJobSystem();
