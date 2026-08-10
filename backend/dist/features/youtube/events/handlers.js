"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerYouTubeEventHandlers = void 0;
const EventBus_1 = require("./EventBus");
const QueueManager_1 = require("@features/youtube/jobs/QueueManager");
const logger_1 = require("@utils/logger");
const registerYouTubeEventHandlers = () => {
    EventBus_1.eventBus.subscribe(EventBus_1.EVENTS.VIDEO_IMPORTED, async (payload) => {
        const { videoId, metadata } = payload;
        logger_1.logger.info(`Video Imported Event Received: ${videoId}. Queuing downstream jobs.`);
        // 1. Queue AI Processing (Category, God, Festival classification, Tag generation)
        await QueueManager_1.queueManager.enqueue('AI_PROCESSING_QUEUE', { videoId, metadata });
        // 2. Queue SEO Generation (Meta titles, description, keywords based on AI output)
        // Note: SEO should technically wait for AI Processing to complete. 
        // In a mature system, AI processing completion event would trigger SEO.
        // For architecture completeness, we show enqueueing here, but in practice, 
        // AI_PROCESSING_QUEUE's worker would emit AI_COMPLETED, which then triggers this.
        // 3. Queue PDF Generation (Generate lyrics PDF once lyrics are ready)
        // Same logic as SEO.
        // 4. Queue Related Bhajan Calculation
        await QueueManager_1.queueManager.enqueue('RELATED_BHAJANS_QUEUE', { videoId });
    });
    EventBus_1.eventBus.subscribe(EventBus_1.EVENTS.VIDEO_UPDATED, async (payload) => {
        logger_1.logger.info(`Video Updated: ${payload.videoId}. Updating search indexes if necessary.`);
    });
    EventBus_1.eventBus.subscribe(EventBus_1.EVENTS.SYNC_STARTED, async (payload) => {
        // Log to DB
    });
    EventBus_1.eventBus.subscribe(EventBus_1.EVENTS.SYNC_COMPLETED, async (payload) => {
        // Log to DB
    });
    logger_1.logger.info('YouTube Event Handlers Registered.');
};
exports.registerYouTubeEventHandlers = registerYouTubeEventHandlers;
