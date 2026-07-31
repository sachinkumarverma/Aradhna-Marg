"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.youtubeVideoRepository = exports.YoutubeVideoRepository = void 0;
const supabase_1 = require("../../database/supabase");
class YoutubeVideoRepository {
    tableName = 'youtube_videos';
    async getVideos(search, status, type, sortBy = 'published_at', sortOrder = 'desc', page = 1, limit = 20) {
        if (type) {
            let allData = [];
            let p = 0;
            let hasMore = true;
            while (hasMore) {
                let q = supabase_1.supabase.from(this.tableName).select('*').order(sortBy, { ascending: sortOrder === 'asc' }).range(p * 1000, (p + 1) * 1000 - 1);
                if (search)
                    q = q.ilike('title', `%${search}%`);
                if (status)
                    q = q.eq('import_status', status);
                const { data, error } = await q;
                if (error || !data || data.length === 0)
                    break;
                allData.push(...data);
                if (data.length < 1000)
                    hasMore = false;
                p++;
            }
            let filtered = allData.filter(v => {
                const str = (v.duration || '').toLowerCase();
                let secs = 0;
                const hMatch = str.match(/(\d+)h/);
                const mMatch = str.match(/(\d+)m/);
                const sMatch = str.match(/(\d+)s/);
                if (hMatch)
                    secs += parseInt(hMatch[1], 10) * 3600;
                if (mMatch)
                    secs += parseInt(mMatch[1], 10) * 60;
                if (sMatch)
                    secs += parseInt(sMatch[1], 10);
                const isShort = secs > 0 && secs <= 180;
                if (type === 'SHORT')
                    return isShort;
                if (type === 'VIDEO')
                    return !isShort;
                return true;
            });
            const total = filtered.length;
            const offset = (page - 1) * limit;
            filtered = filtered.slice(offset, offset + limit);
            return { data: filtered.map(this.mapToModel), total };
        }
        let query = supabase_1.supabase.from(this.tableName).select('*', { count: 'exact' }).order(sortBy, { ascending: sortOrder === 'asc' });
        if (search)
            query = query.ilike('title', `%${search}%`);
        if (status)
            query = query.eq('import_status', status);
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);
        const { data, count, error } = await query;
        if (error) {
            if (error.code === '42P01' || error.message?.includes('schema cache'))
                return { data: [], total: 0 };
            throw error;
        }
        return { data: (data || []).map(this.mapToModel), total: count || 0 };
    }
    async getStats() {
        try {
            const [{ count: total }, { count: linked }, { count: pending }, { count: ignored }] = await Promise.all([
                supabase_1.supabase.from(this.tableName).select('*', { count: 'exact', head: true }),
                supabase_1.supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('import_status', 'LINKED'),
                supabase_1.supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('import_status', 'NEW'),
                supabase_1.supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('import_status', 'IGNORED')
            ]);
            return {
                total: total || 0,
                linked: linked || 0,
                pending: pending || 0,
                ignored: ignored || 0
            };
        }
        catch (error) {
            if (error.code === '42P01' || error.message?.includes('schema cache')) {
                return { total: 0, linked: 0, pending: 0, ignored: 0 };
            }
            throw error;
        }
    }
    async upsertVideos(videos) {
        if (videos.length === 0)
            return { imported: 0, updated: 0 };
        const dbVideos = videos.map(this.mapToDb);
        const incomingIds = dbVideos.map(v => v.youtube_video_id);
        // Check which ones already exist to correctly count new vs updated
        const { data: existingData } = await supabase_1.supabase
            .from(this.tableName)
            .select('youtube_video_id')
            .in('youtube_video_id', incomingIds);
        const existingIds = new Set((existingData || []).map(d => d.youtube_video_id));
        let newCount = 0;
        let updateCount = 0;
        for (const v of dbVideos) {
            if (existingIds.has(v.youtube_video_id)) {
                updateCount++;
            }
            else {
                newCount++;
            }
        }
        // Perform the upsert
        const { error } = await supabase_1.supabase
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
    mapToModel(row) {
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
    mapToDb(model) {
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
        const { data, error } = await supabase_1.supabase
            .from('youtube_sync_logs')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(50);
        if (error) {
            if (error.code === '42P01' || error.message?.includes('schema cache'))
                return [];
            throw error;
        }
        return data;
    }
    async logSync(channelId, status, errorMessage) {
        try {
            await supabase_1.supabase.from('youtube_sync_logs').insert({
                channel_id: channelId,
                status,
                error_message: errorMessage,
                completed_at: new Date().toISOString()
            });
        }
        catch (e) {
            console.error('Failed to log sync', e);
        }
    }
    async linkBhajan(videoId, bhajanId) {
        const { error } = await supabase_1.supabase
            .from(this.tableName)
            .update({
            bhajan_id: bhajanId,
            import_status: bhajanId ? 'LINKED' : 'NEW'
        })
            .eq('id', videoId);
        if (error)
            throw error;
        return { success: true };
    }
    async updateStatus(videoId, status) {
        const { error } = await supabase_1.supabase
            .from(this.tableName)
            .update({ import_status: status })
            .eq('id', videoId);
        if (error)
            throw error;
        return { success: true };
    }
    async deleteVideo(videoId) {
        const { error } = await supabase_1.supabase
            .from(this.tableName)
            .delete()
            .eq('id', videoId);
        if (error)
            throw error;
        return { success: true };
    }
}
exports.YoutubeVideoRepository = YoutubeVideoRepository;
exports.youtubeVideoRepository = new YoutubeVideoRepository();
