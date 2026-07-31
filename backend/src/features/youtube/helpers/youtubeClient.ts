import { google, youtube_v3 } from 'googleapis';
import { config } from '../../../config';
import { InternalServerError } from '../../../errors/appError';
import { logger } from '../../../utils/logger';

class YoutubeClient {
  private youtube: youtube_v3.Youtube;

  constructor() {
    this.youtube = google.youtube({
      version: 'v3',
      auth: config.YOUTUBE_API_KEY,
    });
  }

  /**
   * Fetch all videos for a specific channel using pagination
   * (Optionally filtered by publishedAfter for incremental sync)
   */
  public async getVideos(channelId: string, publishedAfter?: string): Promise<youtube_v3.Schema$Video[]> {
    try {
      let allVideos: youtube_v3.Schema$Video[] = [];
      let nextPageToken: string | undefined = undefined;

      // First, get the Uploads playlist ID for the channel
      const channelRes = await this.youtube.channels.list({
        part: ['contentDetails'],
        id: [channelId],
      });

      const uploadsPlaylistId = channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (!uploadsPlaylistId) {
        throw new InternalServerError('Uploads playlist not found for channel');
      }

      // Paginate through playlist items
      do {
        const playlistRes: any = await this.youtube.playlistItems.list({
          part: ['snippet', 'contentDetails'],
          playlistId: uploadsPlaylistId,
          maxResults: 50,
          pageToken: nextPageToken,
        });

        const videoIds = playlistRes.data.items?.map((item: any) => item.contentDetails?.videoId).filter(Boolean) as string[];
        
        if (videoIds.length > 0) {
          // Fetch full video details including statistics and contentDetails
          const videoRes = await this.youtube.videos.list({
            part: ['snippet', 'statistics', 'contentDetails', 'status'],
            id: videoIds,
          });

          const videos = videoRes.data.items || [];
          
          if (publishedAfter) {
            const filtered = videos.filter(v => 
              new Date(v.snippet!.publishedAt!) > new Date(publishedAfter)
            );
            allVideos = [...allVideos, ...filtered];
            // If we found older videos in this page, we can potentially break early if youtube returns them chronologically
          } else {
            allVideos = [...allVideos, ...videos];
          }
        }

        nextPageToken = playlistRes.data.nextPageToken || undefined;
      } while (nextPageToken);

      return allVideos;
    } catch (error: any) {
      logger.error({ err: error }, 'YouTube API Error');
      if (error.code === 403) {
        throw new InternalServerError('YouTube API quota exceeded or forbidden.');
      }
      throw new InternalServerError('Failed to fetch videos from YouTube.');
    }
  }

  public extractBestThumbnail(thumbnails: youtube_v3.Schema$ThumbnailDetails): string | null {
    if (!thumbnails) return null;
    return (
      thumbnails.maxres?.url ||
      thumbnails.high?.url ||
      thumbnails.medium?.url ||
      thumbnails.standard?.url ||
      thumbnails.default?.url ||
      null
    );
  }

  public parseDuration(ptDuration: string): number {
    // Basic ISO 8601 duration parser (PT#M#S)
    const match = ptDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
  }
}

export const youtubeClient = new YoutubeClient();
