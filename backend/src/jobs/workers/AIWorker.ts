import { BaseWorker } from './BaseWorker';
import { IJobPayload, JobType, PlatformEvent } from '../types';
import { eventBus } from '../events/EventBus';
import { logger } from '../../utils/logger';

export class AIWorker extends BaseWorker {
  constructor(queue: any) {
    super(queue, JobType.AI_PROCESSING, 5000); // Poll every 5s for AI jobs
  }

  protected async process(job: IJobPayload): Promise<void> {
    const { videoId, title } = job.payload;
    
    logger.info(`[AIWorker] Processing AI generation for ${videoId}...`);
    
    // Simulate AI generation via Groq/OpenAI (mocked)
    await new Promise(res => setTimeout(res, 2000));
    
    const extractedData = {
      lyrics: "Mock Lyrics extracted from audio/description",
      category: "Aarti",
      god: "Shiva",
      tags: ["Monday", "Morning"]
    };

    // 1. Update Database (mocked)
    // await supabase.from('bhajans').update(extractedData).eq('youtube_video_id', videoId);
    
    logger.info(`[AIWorker] Generated metadata for ${title}`);

    // 2. Publish Event
    eventBus.publish(PlatformEvent.AI_COMPLETED, {
      videoId,
      title,
      ...extractedData
    });
  }
}
