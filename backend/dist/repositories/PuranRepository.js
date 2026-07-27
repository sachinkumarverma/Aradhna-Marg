"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.puranRepository = exports.PuranRepository = void 0;
const base_repository_1 = require("./base.repository");
class PuranRepository extends base_repository_1.BaseRepository {
    constructor() {
        super('puranas');
    }
    async getList(params) {
        const { page, limit, search, status, language, sort } = params;
        const offset = (page - 1) * limit;
        let query = this.db.from(this.tableName).select('*', { count: 'exact' }).is('deleted_at', null);
        if (status)
            query = query.eq('status', status);
        if (language)
            query = query.eq('language', language);
        if (search) {
            query = query.or(`title.ilike.%${search}%,short_description.ilike.%${search}%`);
        }
        if (sort === 'newest')
            query = query.order('created_at', { ascending: false });
        else if (sort === 'oldest')
            query = query.order('created_at', { ascending: true });
        else if (sort === 'downloads')
            query = query.order('download_count', { ascending: false });
        else if (sort === 'views')
            query = query.order('view_count', { ascending: false });
        else if (sort === 'alphabetical')
            query = query.order('title', { ascending: true });
        else
            query = query.order('created_at', { ascending: false });
        const { data, count, error } = await query.range(offset, offset + limit - 1);
        if (error)
            throw error;
        return { data, count };
    }
    async getById(id) {
        const { data, error } = await this.db.from(this.tableName)
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .single();
        if (error)
            throw error;
        return data;
    }
    async bulkAction(ids, action) {
        if (action === 'DELETE') {
            const { error } = await this.db.from(this.tableName)
                .update({ deleted_at: new Date().toISOString() })
                .in('id', ids);
            if (error)
                throw error;
        }
        else {
            let status = 'DRAFT';
            if (action === 'PUBLISH')
                status = 'PUBLISHED';
            if (action === 'ARCHIVE')
                status = 'ARCHIVED';
            const { error } = await this.db.from(this.tableName).update({ status }).in('id', ids);
            if (error)
                throw error;
        }
    }
    async getBySlug(slug) {
        const { data, error } = await this.db.from(this.tableName)
            .select('*')
            .eq('slug', slug)
            .eq('status', 'PUBLISHED')
            .is('deleted_at', null)
            .single();
        if (error)
            throw error;
        return data;
    }
    async getRelated(id, language, limit = 4) {
        const { data, error } = await this.db.from(this.tableName)
            .select('id, title, slug, language, cover_image, short_description')
            .eq('status', 'PUBLISHED')
            .is('deleted_at', null)
            .neq('id', id)
            .eq('language', language)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error)
            throw error;
        return data;
    }
    async incrementStats(id, field) {
        // using raw rpc or fetch existing and update (supabase limitation for simple increment without RPC)
        const { data: existing } = await this.db.from(this.tableName).select(field).eq('id', id).single();
        if (existing) {
            await this.db.from(this.tableName).update({ [field]: (existing[field] || 0) + 1 }).eq('id', id);
        }
    }
}
exports.PuranRepository = PuranRepository;
exports.puranRepository = new PuranRepository();
