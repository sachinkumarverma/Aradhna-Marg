import axios from 'axios';
import { youtubeVideoRepository } from '../repositories/YoutubeVideoRepository';
import { settingsRepository } from '../../repositories/SettingsRepository';
import { YoutubeVideo } from '../../models/YoutubeVideo';
import { AppError } from '../../errors/appError';

export class YoutubeService {
  async getVideos(search?: string, status?: string) {
    return await youtubeVideoRepository.getVideos(search, status);
  }

  async getStats() {
    return await youtubeVideoRepository.getStats();
  }

  async syncNow() {
    const settings = await settingsRepository.getSettings();
    const channelId = settings?.youtubeChannelId;
    
    if (!channelId) {
      throw new AppError('YouTube Channel ID is not configured in settings', 400);
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new AppError('YouTube API key is missing from server configuration', 500);
    }

    try {
      // 1. Fetch from Youtube API
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=50`;
      const searchRes = await axios.get(searchUrl);
      
      const items = searchRes.data.items || [];
      const videoIds = items
        .filter((item: any) => item.id.kind === 'youtube#video')
        .map((item: any) => item.id.videoId);

      if (videoIds.length === 0) {
        return { imported: 0, updated: 0 };
      }

      // 2. Fetch video details for duration and stats
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoIds.join(',')}&part=snippet,contentDetails,statistics`;
      const detailsRes = await axios.get(detailsUrl);
      
      const videosToUpsert: Partial<YoutubeVideo>[] = detailsRes.data.items.map((item: any) => {
        // Parse ISO 8601 duration (e.g., PT1H2M10S) to something simpler if needed, or just keep as string
        const durationStr = item.contentDetails.duration;
        let formattedDuration = durationStr.replace('PT', '').toLowerCase(); // quick hacky format

        return {
          youtubeVideoId: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
          youtubeUrl: `https://youtube.com/watch?v=${item.id}`,
          publishedAt: item.snippet.publishedAt,
          duration: formattedDuration,
          channelId: item.snippet.channelId,
          channelName: item.snippet.channelTitle,
          viewCount: parseInt(item.statistics.viewCount || '0', 10),
          likeCount: parseInt(item.statistics.likeCount || '0', 10),
          tags: item.snippet.tags || [],
          importStatus: 'NEW',
          lastSynced: new Date().toISOString()
        };
      });

      // 3. Upsert to DB
      const result = await youtubeVideoRepository.upsertVideos(videosToUpsert);

      // 4. Update last sync time
      if (settings.id) {
        await settingsRepository.updateSettings(settings.id, {
          youtubeLastSync: new Date().toISOString()
        });
      }

      return result;
    } catch (error: any) {
      console.error('YouTube API Sync Error:', error.response?.data || error.message);
      throw new AppError('Failed to synchronize with YouTube API', 500);
    }
  }
}

export const youtubeService = new YoutubeService();
