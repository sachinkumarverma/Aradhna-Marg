import { eventBus, EVENTS } from './EventBus';
import { queueManager } from '../jobs/QueueManager';
import { logger } from '../../utils/logger';

export const registerYouTubeEventHandlers = () => {
  eventBus.subscribe(EVENTS.VIDEO_IMPORTED, async (payload) => {
    const { videoId, metadata } = payload;
    logger.info(`Video Imported Event Received: ${videoId}. Queuing downstream jobs.`);

    // 1. Queue AI Processing (Category, God, Festival classification, Tag generation)
    await queueManager.enqueue('AI_PROCESSING_QUEUE', { videoId, metadata });

    // 2. Queue SEO Generation (Meta titles, description, keywords based on AI output)
    // Note: SEO should technically wait for AI Processing to complete. 
    // In a mature system, AI processing completion event would trigger SEO.
    // For architecture completeness, we show enqueueing here, but in practice, 
    // AI_PROCESSING_QUEUE's worker would emit AI_COMPLETED, which then triggers this.

    // 3. Queue PDF Generation (Generate lyrics PDF once lyrics are ready)
    // Same logic as SEO.

    // 4. Queue Related Bhajan Calculation
    await queueManager.enqueue('RELATED_BHAJANS_QUEUE', { videoId });
  });

  eventBus.subscribe(EVENTS.VIDEO_UPDATED, async (payload) => {
    logger.info(`Video Updated: ${payload.videoId}. Updating search indexes if necessary.`);
  });

  eventBus.subscribe(EVENTS.SYNC_STARTED, async (payload) => {
    // Log to DB
  });

  eventBus.subscribe(EVENTS.SYNC_COMPLETED, async (payload) => {
    // Log to DB
  });

  logger.info('YouTube Event Handlers Registered.');
};
