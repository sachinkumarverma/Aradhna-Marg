import { BaseWorker } from './BaseWorker';
import { IJobPayload, JobType, PlatformEvent } from '@/jobs/types';
import { eventBus } from '@/jobs/events/EventBus';
import { logger } from '@utils/logger';

export class YouTubeWorker extends BaseWorker {
  constructor(queue: any) {
    super(queue, JobType.YOUTUBE_SYNC_INCREMENTAL, 10000); // poll every 10s
  }

  protected async process(job: IJobPayload): Promise<void> {
    logger.info(`[YouTubeWorker] Starting incremental sync...`);
    
    // 1. Fetch channel metadata (mocked)
    const newVideos = [
      { videoId: 'abc123_', title: 'New Shiv Bhajan' },
      { videoId: 'xyz987_', title: 'Aarti Collection' }
    ];

    if (newVideos.length === 0) {
      logger.info(`[YouTubeWorker] No new videos found.`);
      return;
    }

    // 2. Insert minimal records into Database (mocked)
    for (const video of newVideos) {
      
      logger.info(`[YouTubeWorker] Imported video ${video.videoId}`);

      // 3. ✨ ARCHITECTURE KEY: Publish Event rather than calling AI queue directly ✨
      eventBus.publish(PlatformEvent.VIDEO_IMPORTED, {
        videoId: video.videoId,
        title: video.title,
        jobId: job.id
      });
    }

    eventBus.publish(PlatformEvent.SYNC_COMPLETED, { count: newVideos.length });
  }
}
