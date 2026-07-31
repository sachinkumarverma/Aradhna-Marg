"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorRepository = exports.AuthorRepository = void 0;
const supabase_1 = require("../database/supabase");
class AuthorRepository {
    tableName = 'authors';
    mapToModel(row) {
        return {
            id: row.id,
            name: row.name,
            photo: row.photo,
            shortDescription: row.short_description,
            status: row.status,
            seoTitle: row.seo_title,
            seoDescription: row.seo_description,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at
        };
    }
    mapToDb(dto) {
        const dbData = {};
        if (dto.name !== undefined)
            dbData.name = dto.name;
        if (dto.photo !== undefined)
            dbData.photo = dto.photo;
        if (dto.shortDescription !== undefined)
            dbData.short_description = dto.shortDescription;
        if (dto.status !== undefined)
            dbData.status = dto.status;
        if (dto.seoTitle !== undefined)
            dbData.seo_title = dto.seoTitle;
        if (dto.seoDescription !== undefined)
            dbData.seo_description = dto.seoDescription;
        return dbData;
    }
    async findAll(options = {}) {
        const { search, sort = 'created_at', order = 'desc', page = 1, limit = 10, status } = options;
        const offset = (page - 1) * limit;
        let query = supabase_1.supabase.from(this.tableName).select('*', { count: 'exact' });
        if (search) {
            query = query.ilike('name', `%${search}%`);
        }
        if (status) {
            query = query.eq('status', status);
        }
        query = query.order(sort === 'name' ? 'name' : 'created_at', { ascending: order === 'asc' });
        query = query.range(offset, offset + limit - 1);
        const { data, error, count } = await query;
        if (error)
            throw error;
        return { data: data.map(this.mapToModel), total: count || 0 };
    }
    async findById(id) {
        const { data, error } = await supabase_1.supabase.from(this.tableName).select('*').eq('id', id).single();
        if (error && error.code !== 'PGRST116')
            throw error;
        if (!data)
            return null;
        return this.mapToModel(data);
    }
    async create(dto) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert([this.mapToDb(dto)])
            .select()
            .single();
        if (error)
            throw error;
        return this.mapToModel(data);
    }
    async update(id, dto) {
        const dbData = this.mapToDb(dto);
        dbData.updated_at = new Date().toISOString();
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .update(dbData)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return this.mapToModel(data);
    }
    async delete(id) {
        const { error } = await supabase_1.supabase.from(this.tableName).delete().eq('id', id);
        if (error)
            throw error;
    }
}
exports.AuthorRepository = AuthorRepository;
exports.authorRepository = new AuthorRepository();
