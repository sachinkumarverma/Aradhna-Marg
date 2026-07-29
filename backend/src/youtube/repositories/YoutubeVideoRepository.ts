import { supabase } from '../../database/supabase';
import { YoutubeVideo } from '../../models/YoutubeVideo';

export class YoutubeVideoRepository {
  private readonly tableName = 'youtube_videos';

  async getVideos(search?: string, status?: string): Promise<YoutubeVideo[]> {
    let query = supabase.from(this.tableName).select('*').order('published_at', { ascending: false });

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (status) {
      query = query.eq('import_status', status);
    }

    const { data, error } = await query;
    if (error) {
      if (error.code === '42P01' || error.message?.includes('schema cache')) {
        // Table doesn't exist yet, return empty list gracefully
        return [];
      }
      throw error;
    }

    return (data || []).map(this.mapToModel);
  }

  async getStats() {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('import_status', { count: 'exact' });

    if (error) {
      if (error.code === '42P01' || error.message?.includes('schema cache')) {
         return { total: 0, linked: 0, pending: 0, ignored: 0 };
      }
      throw error;
    }

    const stats = {
      total: data.length,
      linked: 0,
      pending: 0,
      ignored: 0
    };

    data.forEach((row: any) => {
      if (row.import_status === 'LINKED') stats.linked++;
      else if (row.import_status === 'IGNORED') stats.ignored++;
      else if (row.import_status === 'NEW' || row.import_status === 'REVIEWED') stats.pending++;
    });

    return stats;
  }

  async upsertVideos(videos: Partial<YoutubeVideo>[]) {
    if (videos.length === 0) return { imported: 0, updated: 0 };
    
    const dbVideos = videos.map(this.mapToDb);
    
    // We try an upsert, matching on youtube_video_id
    const { data, error } = await supabase
      .from(this.tableName)
      .upsert(dbVideos, { onConflict: 'youtube_video_id' })
      .select('id, import_status');

    if (error) {
      if (error.code === '42P01' || error.message?.includes('schema cache')) {
        throw new Error('Database table "youtube_videos" is missing. Please run the SQL migration in your Supabase Dashboard to create it.');
      }
      throw error;
    }
    
    return {
      imported: data.filter((d: any) => d.import_status === 'NEW').length,
      updated: data.filter((d: any) => d.import_status !== 'NEW').length
    };
  }

  private mapToModel(row: any): YoutubeVideo {
    return {
      id: row.id,
      youtubeVideoId: row.youtube_video_id,
      title: row.title,
      description: row.description,
      thumbnail: row.thumbnail,
      youtubeUrl: row.youtube_url,
      publishedAt: row.published_at,
      duration: row.duration,
      channelId: row.channel_id,
      channelName: row.channel_name,
      viewCount: row.view_count,
      likeCount: row.like_count,
      tags: row.tags,
      playlist: row.playlist,
      importStatus: row.import_status,
      linkedBhajanId: row.linked_bhajan_id,
      lastSynced: row.last_synced,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapToDb(model: Partial<YoutubeVideo>): any {
    return {
      youtube_video_id: model.youtubeVideoId,
      title: model.title,
      description: model.description,
      thumbnail: model.thumbnail,
      youtube_url: model.youtubeUrl,
      published_at: model.publishedAt,
      duration: model.duration,
      channel_id: model.channelId,
      channel_name: model.channelName,
      view_count: model.viewCount,
      like_count: model.likeCount,
      tags: model.tags,
      import_status: model.importStatus || 'NEW',
      last_synced: model.lastSynced || new Date().toISOString()
    };
  }
}

export const youtubeVideoRepository = new YoutubeVideoRepository();
