import { supabase } from '../../database/supabase';
import { YoutubeVideo } from '../../models/YoutubeVideo';

export class YoutubeVideoRepository {
  private readonly tableName = 'youtube_videos';

  async getVideos(search?: string, status?: string, page = 1, limit = 20) {
    let query = supabase.from(this.tableName).select('*', { count: 'exact' }).order('published_at', { ascending: false });

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (status) {
      query = query.eq('import_status', status);
    }
    
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) {
      if (error.code === '42P01' || error.message?.includes('schema cache')) {
        // Table doesn't exist yet, return empty list gracefully
        return { data: [], total: 0 };
      }
      throw error;
    }

    return { data: (data || []).map(this.mapToModel), total: count || 0 };
  }

  async getStats() {
    try {
      const [
        { count: total }, 
        { count: linked }, 
        { count: pending }, 
        { count: ignored }
      ] = await Promise.all([
        supabase.from(this.tableName).select('*', { count: 'exact', head: true }),
        supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('import_status', 'LINKED'),
        supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('import_status', 'NEW'),
        supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('import_status', 'IGNORED')
      ]);

      return {
        total: total || 0,
        linked: linked || 0,
        pending: pending || 0,
        ignored: ignored || 0
      };
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('schema cache')) {
        return { total: 0, linked: 0, pending: 0, ignored: 0 };
      }
      throw error;
    }
  }

  async upsertVideos(videos: Partial<YoutubeVideo>[]) {
    if (videos.length === 0) return { imported: 0, updated: 0 };
    
    const dbVideos = videos.map(this.mapToDb);
    const incomingIds = dbVideos.map(v => v.youtube_video_id);
    
    // Check which ones already exist to correctly count new vs updated
    const { data: existingData } = await supabase
      .from(this.tableName)
      .select('youtube_video_id')
      .in('youtube_video_id', incomingIds);
      
    const existingIds = new Set((existingData || []).map(d => d.youtube_video_id));
    
    let newCount = 0;
    let updateCount = 0;
    
    for (const v of dbVideos) {
      if (existingIds.has(v.youtube_video_id)) {
        updateCount++;
      } else {
        newCount++;
      }
    }
    
    // Perform the upsert
    const { error } = await supabase
      .from(this.tableName)
      .upsert(dbVideos, { onConflict: 'youtube_video_id' });

    if (error) {
      if (error.code === '42P01' || error.message?.includes('schema cache')) {
        throw new Error('Database table "youtube_videos" is missing. Please run the SQL migration in your Supabase Dashboard to create it.');
      }
      throw error;
    }
    
    return {
      imported: newCount,
      updated: updateCount
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

  async getSyncHistory() {
    const { data, error } = await supabase
      .from('youtube_sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50);
      
    if (error) {
      if (error.code === '42P01' || error.message?.includes('schema cache')) return [];
      throw error;
    }
    return data;
  }

  async logSync(channelId: string, status: string, errorMessage?: string) {
    try {
      await supabase.from('youtube_sync_logs').insert({
        channel_id: channelId,
        status,
        error_message: errorMessage,
        completed_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to log sync', e);
    }
  }

  async linkBhajan(videoId: string, bhajanId: string | null) {
    const { error } = await supabase
      .from(this.tableName)
      .update({ 
        bhajan_id: bhajanId, 
        import_status: bhajanId ? 'LINKED' : 'NEW' 
      })
      .eq('id', videoId);
    
    if (error) throw error;
    return { success: true };
  }

  async updateStatus(videoId: string, status: string) {
    const { error } = await supabase
      .from(this.tableName)
      .update({ import_status: status })
      .eq('id', videoId);
    
    if (error) throw error;
    return { success: true };
  }

  async deleteVideo(videoId: string) {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', videoId);
      
    if (error) throw error;
    return { success: true };
  }
}

export const youtubeVideoRepository = new YoutubeVideoRepository();
