import { youtubeClient } from '../helpers/youtubeClient';
import { logger } from '../../utils/logger';
import { eventBus, EVENTS } from '../events/EventBus';
import { IVideoMetadata } from '../interfaces';
import { generateUniqueSlug } from '../../helpers/slug';
import { supabase } from '../../database/supabase';

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
        const { data: existing } = await supabase
          .from('bhajans')
          .select('id')
          .eq('youtube_video_id', metadata.youtube_video_id)
          .single();
        
        if (existing) {
          // Update existing
          await supabase
            .from('bhajans')
            .update({
              title: metadata.title,
              description: metadata.description,
              thumbnail_url: metadata.thumbnail_url,
              duration: metadata.duration,
              views: metadata.views,
              status: metadata.status
            })
            .eq('id', existing.id);

          updatedCount++;
          eventBus.publish(EVENTS.VIDEO_UPDATED, { videoId: metadata.youtube_video_id });
        } else {
          // Insert new
          const slug = await generateUniqueSlug(metadata.title, 'bhajans');
          const { data: newBhajan, error } = await supabase
            .from('bhajans')
            .insert({
              ...metadata,
              slug,
              published_date: metadata.published_date.toISOString()
            })
            .select('id')
            .single();

          if (error) {
            logger.error(`Failed to insert bhajan ${metadata.title}:`, error);
            continue;
          }

          importedCount++;
          // Trigger Background Jobs (AI, PDF, SEO)
          eventBus.publish(EVENTS.VIDEO_IMPORTED, { videoId: metadata.youtube_video_id, metadata });
        }
      }

      // Cleanup logic for deleted videos (only run during full syncs)
      if (!publishedAfter && fetchedVideoIds.length > 0) {
        const { data: activeVideos } = await supabase
          .from('bhajans')
          .select('id, youtube_video_id')
          .not('youtube_video_id', 'is', null)
          .eq('status', 'PUBLISHED');

        if (activeVideos) {
          const orphanedVideoIds = activeVideos
            .filter(v => v.youtube_video_id && !fetchedVideoIds.includes(v.youtube_video_id))
            .map(v => v.id);

          if (orphanedVideoIds.length > 0) {
            logger.info(`Found ${orphanedVideoIds.length} videos deleted on YouTube. Marking as DRAFT.`);
            await supabase
              .from('bhajans')
              .update({ status: 'DRAFT' })
              .in('id', orphanedVideoIds);
          }
        }
      }

      logger.success(`YouTube Sync completed. Imported: ${importedCount}, Updated: ${updatedCount}`);
      
      // Log sync history
      await supabase.from('youtube_sync_logs').insert({
        channel_id: channelId,
        status: 'COMPLETED',
        started_at: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('YouTube Sync failed:', error);
      eventBus.publish(EVENTS.SYNC_FAILED, { channelId, error: error.message });
      throw error;
    }
  }
}

export const youtubeSyncService = new YoutubeSyncService();
