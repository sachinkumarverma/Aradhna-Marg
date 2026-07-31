"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagRepository = exports.TagRepository = void 0;
const supabase_1 = require("../database/supabase");
const appError_1 = require("../errors/appError");
class TagRepository {
    tableName = 'tags';
    mapToModel(row) {
        return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            color: row.color,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at,
            createdBy: row.created_by,
            updatedBy: row.updated_by
        };
    }
    mapToDb(dto) {
        const dbData = {};
        if (dto.name !== undefined)
            dbData.name = dto.name;
        if (dto.slug !== undefined)
            dbData.slug = dto.slug;
        if (dto.description !== undefined)
            dbData.description = dto.description;
        if (dto.color !== undefined)
            dbData.color = dto.color;
        if (dto.status !== undefined)
            dbData.status = dto.status;
        return dbData;
    }
    async findAll(options = {}) {
        const { search, sort = 'created_at', order = 'desc', page = 1, limit = 10, status } = options;
        const offset = (page - 1) * limit;
        let query = supabase_1.supabase.from(this.tableName).select('*', { count: 'exact' });
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
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
        if (error) {
            if (error.code === '23505')
                throw new appError_1.ConflictError('Tag slug already exists');
            throw error;
        }
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
        if (error) {
            if (error.code === '23505')
                throw new appError_1.ConflictError('Tag slug already exists');
            throw error;
        }
        return this.mapToModel(data);
    }
    async delete(id) {
        const { error } = await supabase_1.supabase.from(this.tableName).delete().eq('id', id);
        if (error)
            throw error;
    }
}
exports.TagRepository = TagRepository;
exports.tagRepository = new TagRepository();
