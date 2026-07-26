"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const supabase_1 = require("../database/supabase");
class BaseRepository {
    tableName;
    db;
    constructor(tableName) {
        this.tableName = tableName;
        this.db = supabase_1.supabase;
    }
    async findAll(options) {
        let query = this.db.from(this.tableName).select(options?.select || '*');
        if (options?.order) {
            query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
        }
        const { data, error } = await query;
        if (error)
            throw error;
        return data;
    }
    async findById(id) {
        const { data, error } = await this.db.from(this.tableName).select('*').eq('id', id).single();
        if (error && error.code !== 'PGRST116')
            throw error; // PGRST116 is not found
        return data || null;
    }
    async findBySlug(slug) {
        const { data, error } = await this.db.from(this.tableName).select('*').eq('slug', slug).single();
        if (error && error.code !== 'PGRST116')
            throw error;
        return data || null;
    }
    async create(data) {
        const { data: created, error } = await this.db.from(this.tableName).insert(data).select().single();
        if (error)
            throw error;
        return created;
    }
    async update(id, data) {
        const { data: updated, error } = await this.db.from(this.tableName).update(data).eq('id', id).select().single();
        if (error)
            throw error;
        return updated;
    }
    async delete(id) {
        const { error } = await this.db.from(this.tableName).delete().eq('id', id);
        if (error)
            throw error;
        return true;
    }
    async paginate(page, limit, filters) {
        const offset = (page - 1) * limit;
        let query = this.db.from(this.tableName).select('*', { count: 'exact' });
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    query = query.eq(key, value);
                }
            });
        }
        const { data, error, count } = await query.range(offset, offset + limit - 1);
        if (error)
            throw error;
        return {
            data: data || [],
            total: count || 0,
            page,
            limit,
        };
    }
    async search(queryText, options) {
        // Assuming FTS column is search_vector, this is a basic wrapper.
        // For specific advanced searching, subclasses should override this.
        const { data, error } = await this.db
            .from(this.tableName)
            .select(options?.select || '*')
            .textSearch('search_vector', queryText, { config: 'english' })
            .limit(options?.limit || 20);
        if (error)
            throw error;
        return data;
    }
}
exports.BaseRepository = BaseRepository;
