import { randomUUID } from 'crypto';
import { youtubeClient } from './helpers/youtubeClient';
import { logger } from '@utils/logger';
import { eventBus, EVENTS } from './events/EventBus';
import { IVideoMetadata } from './interfaces';
import { generateUniqueSlug } from '@/helpers/slug';
import { db } from '@common/database/DatabaseClient';

class YoutubeSyncService {
  /**
   * Orchestrates the sync of videos from a channel.
   * If publishedAfter is provided, performs an incremental sync.
   */
  public async syncChannel(channelId: string, publishedAfter?: string): Promise<void> {
    logger.info(`Starting YouTube Sync for channel: ${channelId}`);
    eventBus.publish(EVENTS.SYNC_STARTED, { channelId, publishedAfter });

    try {
      const videos = await youtubeClient.getVideos(channelId, publishedAfter);
      
      let importedCount = 0;
      let updatedCount = 0;
      const fetchedVideoIds: string[] = [];

      for (const video of videos) {
        if (!video.snippet || !video.id) continue;
        
        fetchedVideoIds.push(video.id);

        const metadata: IVideoMetadata = {
          youtube_video_id: video.id,
          title: video.snippet.title || 'Untitled',
          description: video.snippet.description || '',
          published_date: new Date(video.snippet.publishedAt!),
          thumbnail_url: youtubeClient.extractBestThumbnail(video.snippet.thumbnails!),
          duration: youtubeClient.parseDuration(video.contentDetails?.duration || 'PT0S'),
          views: parseInt(video.statistics?.viewCount || '0', 10),
          status: video.status?.privacyStatus === 'public' ? 'PUBLISHED' : 'DRAFT',
        };

        // Check if video exists in DB
        const existingResult = await db.query(
          `SELECT id FROM bhajans WHERE youtube_video_id = $1 LIMIT 1`,
          [metadata.youtube_video_id]
        );
        
        if ((existingResult.rowCount ?? 0) > 0) {
          // Update existing
          const existing = existingResult.rows[0];
          await db.query(
            `UPDATE bhajans SET
              title = $1, description = $2, thumbnail_url = $3, duration = $4, views = $5, status = $6
            WHERE id = $7`,
            [metadata.title, metadata.description, metadata.thumbnail_url, metadata.duration, metadata.views, metadata.status, existing.id]
          );

          updatedCount++;
          eventBus.publish(EVENTS.VIDEO_UPDATED, { videoId: metadata.youtube_video_id });
        } else {
          // Insert new
          const slug = await generateUniqueSlug(metadata.title, 'bhajans');
          
          try {
            await db.query(
              `INSERT INTO bhajans (
                youtube_video_id, title, description, thumbnail_url, duration, views, status, slug, published_date
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                metadata.youtube_video_id, metadata.title, metadata.description, metadata.thumbnail_url,
                metadata.duration, metadata.views, metadata.status, slug, metadata.published_date.toISOString()
              ]
            );
            importedCount++;
            // Trigger Background Jobs (AI, PDF, SEO)
            eventBus.publish(EVENTS.VIDEO_IMPORTED, { videoId: metadata.youtube_video_id, metadata });
          } catch (error: any) {
            logger.error(`Failed to insert bhajan ${metadata.title}:`, error);
            continue;
          }
        }
      }

      // Cleanup logic for deleted videos (only run during full syncs)
      if (!publishedAfter && fetchedVideoIds.length > 0) {
        const activeVideosResult = await db.query(
          `SELECT id, youtube_video_id FROM bhajans WHERE youtube_video_id IS NOT NULL AND status = 'PUBLISHED'`
        );

        if ((activeVideosResult.rowCount ?? 0) > 0) {
          const orphanedVideoIds = activeVideosResult.rows
            .filter(v => v.youtube_video_id && !fetchedVideoIds.includes(v.youtube_video_id))
            .map(v => v.id);

          if (orphanedVideoIds.length > 0) {
            logger.info(`Found ${orphanedVideoIds.length} videos deleted on YouTube. Marking as DRAFT.`);
            const placeholders = orphanedVideoIds.map((_, i) => `$${i + 1}`).join(',');
            await db.query(
              `UPDATE bhajans SET status = 'DRAFT' WHERE id IN (${placeholders})`,
              orphanedVideoIds
            );
          }
        }
      }

      logger.info(`YouTube Sync completed. Imported: ${importedCount}, Updated: ${updatedCount}`);
      
      // Log sync history
      try {
        await db.query(
          `INSERT INTO youtube_sync_logs (channel_id, status, started_at, error_message) VALUES ($1, $2, NOW(), $3)`,
          [channelId, 'COMPLETED', `Imported: ${importedCount}, Updated: ${updatedCount}`]
        );
      } catch (err) {
        // Ignore if table doesn't exist
      }

    } catch (error: any) {
      logger.error('YouTube Sync failed:', error);
      eventBus.publish(EVENTS.SYNC_FAILED, { channelId, error: error.message });
      throw error;
    }
  }
}

export const youtubeSyncService = new YoutubeSyncService();
