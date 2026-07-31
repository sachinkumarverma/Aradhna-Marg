import { db } from '@common/database/DatabaseClient';
import { YoutubeVideo } from '@models/YoutubeVideo';

export class YoutubeVideoRepository {
  private readonly tableName = 'youtube_videos';

  async getVideos(search?: string, status?: string, type?: string, sortBy = 'published_at', sortOrder = 'desc', page = 1, limit = 20) {
    if (type) {
      // For type filtering, fetch all matching videos without limit, filter them in memory, then paginate
      const params: any[] = [];
      let whereClauses: string[] = [];

      if (search) {
        whereClauses.push(`title ILIKE $${params.length + 1}`);
        params.push(`%${search}%`);
      }
      if (status) {
        whereClauses.push(`import_status = $${params.length + 1}`);
        params.push(status);
      }

      const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
      const orderByStr = `ORDER BY ${sortBy} ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`;

      const allDataQuery = `SELECT * FROM ${this.tableName} ${whereStr} ${orderByStr}`;
      const result = await db.query(allDataQuery, params);
      
      let filtered = result.rows.filter(v => {
        const str = (v.duration || '').toLowerCase();
        let secs = 0;
        const hMatch = str.match(/(\d+)h/);
        const mMatch = str.match(/(\d+)m/);
        const sMatch = str.match(/(\d+)s/);
        if (hMatch) secs += parseInt(hMatch[1], 10) * 3600;
        if (mMatch) secs += parseInt(mMatch[1], 10) * 60;
        if (sMatch) secs += parseInt(sMatch[1], 10);
        const isShort = secs > 0 && secs <= 180;
        if (type === 'SHORT') return isShort;
        if (type === 'VIDEO') return !isShort;
        return true;
      });
      
      const total = filtered.length;
      const offset = (page - 1) * limit;
      filtered = filtered.slice(offset, offset + limit);
      return { data: filtered.map(this.mapToModel), total };
    }

    const params: any[] = [];
    let whereClauses: string[] = [];

    if (search) {
      whereClauses.push(`title ILIKE $${params.length + 1}`);
      params.push(`%${search}%`);
    }
    if (status) {
      whereClauses.push(`import_status = $${params.length + 1}`);
      params.push(status);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const orderByStr = `ORDER BY ${sortBy} ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
    const offset = (page - 1) * limit;

    const dataQuery = `SELECT * FROM ${this.tableName} ${whereStr} ${orderByStr} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereStr}`;

    try {
      const [dataResult, countResult] = await Promise.all([
        db.query(dataQuery, [...params, limit, offset]),
        db.query(countQuery, params)
      ]);

      const total = parseInt(countResult.rows[0].total, 10);
      return { data: dataResult.rows.map(this.mapToModel), total };
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) return { data: [], total: 0 };
      throw error;
    }
  }

  async getStats() {
    try {
      const queries = [
        `SELECT COUNT(*) as total FROM ${this.tableName}`,
        `SELECT COUNT(*) as total FROM ${this.tableName} WHERE import_status = 'LINKED'`,
        `SELECT COUNT(*) as total FROM ${this.tableName} WHERE import_status = 'NEW'`,
        `SELECT COUNT(*) as total FROM ${this.tableName} WHERE import_status = 'IGNORED'`
      ];

      const results = await Promise.all(queries.map(q => db.query(q)));
      return {
        total: parseInt(results[0].rows[0].total, 10) || 0,
        linked: parseInt(results[1].rows[0].total, 10) || 0,
        pending: parseInt(results[2].rows[0].total, 10) || 0,
        ignored: parseInt(results[3].rows[0].total, 10) || 0
      };
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return { total: 0, linked: 0, pending: 0, ignored: 0 };
      }
      throw error;
    }
  }

  async upsertVideos(videos: Partial<YoutubeVideo>[]) {
    if (videos.length === 0) return { imported: 0, updated: 0 };
    
    const dbVideos = videos.map(v => this.mapToDb(v));
    const incomingIds = dbVideos.map(v => v.youtube_video_id);
    
    const placeholders = incomingIds.map((_, i) => `$${i + 1}`).join(',');
    let existingIds = new Set<string>();
    
    try {
      const existingResult = await db.query(`SELECT youtube_video_id FROM ${this.tableName} WHERE youtube_video_id IN (${placeholders})`, incomingIds);
      existingResult.rows.forEach(r => existingIds.add(r.youtube_video_id));
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        throw new Error('Database table "youtube_videos" is missing. Please run the SQL migration in your PostgreSQL database to create it.');
      }
      throw error;
    }
    
    let newCount = 0;
    let updateCount = 0;
    
    for (const v of dbVideos) {
      if (existingIds.has(v.youtube_video_id)) {
        updateCount++;
      } else {
        newCount++;
      }
    }
    
    // We can use an UPSERT query for each video or a massive batch upsert.
    for (const v of dbVideos) {
      const query = `
        INSERT INTO ${this.tableName} (
          youtube_video_id, title, description, thumbnail, youtube_url, published_at, duration,
          channel_id, channel_name, view_count, like_count, tags, import_status, last_synced
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        )
        ON CONFLICT (youtube_video_id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          thumbnail = EXCLUDED.thumbnail,
          youtube_url = EXCLUDED.youtube_url,
          published_at = EXCLUDED.published_at,
          duration = EXCLUDED.duration,
          channel_id = EXCLUDED.channel_id,
          channel_name = EXCLUDED.channel_name,
          view_count = EXCLUDED.view_count,
          like_count = EXCLUDED.like_count,
          tags = EXCLUDED.tags,
          last_synced = EXCLUDED.last_synced
      `;
      const params = [
        v.youtube_video_id, v.title, v.description, v.thumbnail, v.youtube_url, v.published_at, v.duration,
        v.channel_id, v.channel_name, v.view_count, v.like_count, v.tags || null, v.import_status, v.last_synced
      ];
      await db.query(query, params);
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
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
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
    try {
      const result = await db.query(`SELECT * FROM youtube_sync_logs ORDER BY started_at DESC LIMIT 50`);
      return result.rows;
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) return [];
      throw error;
    }
  }

  async logSync(channelId: string, status: string, errorMessage?: string) {
    try {
      await db.query(
        `INSERT INTO youtube_sync_logs (channel_id, status, error_message, completed_at) VALUES ($1, $2, $3, NOW())`,
        [channelId, status, errorMessage]
      );
    } catch (e) {
      console.error('Failed to log sync', e);
    }
  }

  async linkBhajan(videoId: string, bhajanId: string | null) {
    await db.query(
      `UPDATE ${this.tableName} SET linked_bhajan_id = $1, import_status = $2 WHERE id = $3`,
      [bhajanId, bhajanId ? 'LINKED' : 'NEW', videoId]
    );
    return { success: true };
  }

  async updateStatus(videoId: string, status: string) {
    await db.query(
      `UPDATE ${this.tableName} SET import_status = $1 WHERE id = $2`,
      [status, videoId]
    );
    return { success: true };
  }

  async deleteVideo(videoId: string) {
    await db.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [videoId]);
    return { success: true };
  }
}

export const youtubeVideoRepository = new YoutubeVideoRepository();
