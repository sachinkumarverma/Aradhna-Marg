import axios from 'axios';
import { youtubeVideoRepository } from './YoutubeRepository';
import { db } from '../../common/database/DatabaseClient';
import { YoutubeVideo } from '../../models/YoutubeVideo';
import { AppError } from '../../errors/appError';

export class YoutubeService {
  async getVideos(search?: string, status?: string, type?: string, sortBy = 'published_at', sortOrder = 'desc', page = 1, limit = 20) {
    return await youtubeVideoRepository.getVideos(search, status, type, sortBy, sortOrder, page, limit);
  }

  async getStats() {
    const dbStats = await youtubeVideoRepository.getStats();
    let channelTotal = 0;
    let channelTitle = '';
    let channelThumbnail = '';
    
    try {
      const settingsResult = await db.query(`SELECT youtube_channel_id FROM settings LIMIT 1`);
      const apiKey = process.env.YOUTUBE_API_KEY;
      if ((settingsResult.rowCount ?? 0) > 0 && settingsResult.rows[0].youtube_channel_id && apiKey) {
        const channelId = settingsResult.rows[0].youtube_channel_id;
        const res = await axios.get(`https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&id=${channelId}&part=statistics,snippet`);
        if (res.data.items && res.data.items.length > 0) {
          const channel = res.data.items[0];
          channelTotal = parseInt(channel.statistics.videoCount || '0', 10);
          channelTitle = channel.snippet.title;
          channelThumbnail = channel.snippet.thumbnails?.default?.url || '';
        }
      }
    } catch (error) {
      console.error('Failed to fetch channel stats', error);
    }
    
    return { ...dbStats, channelTotal, channelTitle, channelThumbnail };
  }

  async getSyncHistory() {
    return await youtubeVideoRepository.getSyncHistory();
  }

  async syncNow() {
    const settingsResult = await db.query(`SELECT id, youtube_channel_id FROM settings LIMIT 1`);
    if ((settingsResult.rowCount ?? 0) === 0) {
      throw new AppError('YouTube configuration is missing in settings', 400);
    }
    const settings = settingsResult.rows[0];
    const channelId = settings.youtube_channel_id;
    
    if (!channelId) {
      throw new AppError('YouTube Channel ID is not configured in settings', 400);
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new AppError('YouTube API key is missing from server configuration', 500);
    }

    try {
      // We use the Channel's Uploads Playlist instead of search for 100% reliable chronological retrieval
      // The Uploads playlist ID is the Channel ID with 'UU' instead of 'UC'
      const uploadsPlaylistId = 'UU' + channelId.substring(2);
      
      let pageToken: string | undefined = undefined;
      let totalImported = 0;
      let totalUpdated = 0;
      let pagesFetched = 0;
      const MAX_PAGES = 50; // Cap at ~2500 videos per sync to prevent timeouts

      do {
        const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?key=${apiKey}&playlistId=${uploadsPlaylistId}&part=snippet&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ''}`;
        const res = await axios.get(playlistUrl);
        
        const items = res.data.items || [];
        if (items.length === 0) break;
        
        const videoIds = items.map((item: any) => item.snippet.resourceId.videoId);
        
        if (videoIds.length === 0) break;

        // Fetch video details for duration and stats
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoIds.join(',')}&part=snippet,contentDetails,statistics`;
        const detailsRes = await axios.get(detailsUrl);
        
        const videosToUpsert: Partial<YoutubeVideo>[] = detailsRes.data.items.map((item: any) => {
          // Parse ISO 8601 duration (e.g., PT1H2M10S) to something simpler
          const durationStr = item.contentDetails.duration;
          let formattedDuration = durationStr.replace('PT', '').toLowerCase();

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

        // Upsert to DB
        const result = await youtubeVideoRepository.upsertVideos(videosToUpsert);
        totalImported += result.imported;
        totalUpdated += result.updated;

        pageToken = res.data.nextPageToken;
        pagesFetched++;

        // Optimization: If a whole page of 50 videos results in 0 new imports, we've likely hit the 
        // fully imported historical catalog. Break early to save API quota, but always fetch at least 
        // 2 pages to keep recent video view counts updated.
        if (pagesFetched >= 2 && result.imported === 0) {
          break;
        }

      } while (pageToken && pagesFetched < MAX_PAGES);

      // 4. Update last sync time
      if (settings.id) {
        await db.query(`UPDATE settings SET youtube_last_sync = NOW() WHERE id = $1`, [settings.id]);
      }

      await youtubeVideoRepository.logSync(channelId, 'COMPLETED', `Imported: ${totalImported}, Updated: ${totalUpdated}`);

      return { imported: totalImported, updated: totalUpdated };
    } catch (error: any) {
      console.error('YouTube API Sync Error:', error.response?.data || error.message);
      await youtubeVideoRepository.logSync(channelId, 'FAILED', error.message);
      throw new AppError('Failed to synchronize with YouTube API', 500);
    }
  }
  async linkBhajan(videoId: string, bhajanId: string | null) {
    return await youtubeVideoRepository.linkBhajan(videoId, bhajanId);
  }

  async updateStatus(videoId: string, status: string) {
    return await youtubeVideoRepository.updateStatus(videoId, status);
  }

  async deleteVideo(videoId: string) {
    return await youtubeVideoRepository.deleteVideo(videoId);
  }

  async getBhajansForLink() {
    const result = await db.query(`SELECT id, title FROM bhajans ORDER BY title ASC`);
    return result.rows;
  }
}

export const youtubeService = new YoutubeService();
