"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeityRepository = void 0;
const supabase_1 = require("../../database/supabase");
class DeityRepository {
    tableName = 'deities';
    async findAll(page = 1, limit = 10, search) {
        let query = supabase_1.supabase
            .from(this.tableName)
            .select('*', { count: 'exact' });
        if (search) {
            query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
        }
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        const { data, count, error } = await query
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false })
            .range(from, to);
        if (error)
            throw error;
        return {
            data,
            meta: {
                total: count || 0,
                page,
                limit,
                totalPages: Math.ceil((count || 0) / limit)
            }
        };
    }
    async findById(id) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw error;
        return data;
    }
    async findBySlug(slug) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('slug', slug)
            .single();
        if (error && error.code !== 'PGRST116')
            throw error;
        return data;
    }
    mapToDb(dto) {
        const dbData = {};
        if (dto.name !== undefined)
            dbData.name = dto.name;
        if (dto.slug !== undefined)
            dbData.slug = dto.slug;
        if (dto.shortDescription !== undefined)
            dbData.short_description = dto.shortDescription;
        if (dto.image !== undefined)
            dbData.image = dto.image;
        if (dto.displayOrder !== undefined)
            dbData.display_order = dto.displayOrder;
        if (dto.featured !== undefined)
            dbData.featured = dto.featured;
        if (dto.status !== undefined)
            dbData.status = dto.status;
        if (dto.seoTitle !== undefined)
            dbData.seo_title = dto.seoTitle;
        if (dto.seoDescription !== undefined)
            dbData.seo_description = dto.seoDescription;
        if (dto.createdBy !== undefined)
            dbData.created_by = dto.createdBy;
        if (dto.updatedBy !== undefined)
            dbData.updated_by = dto.updatedBy;
        if (dto.updatedAt !== undefined)
            dbData.updated_at = dto.updatedAt;
        return dbData;
    }
    async create(data) {
        const { data: created, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert([this.mapToDb(data)])
            .select()
            .single();
        if (error)
            throw error;
        return created;
    }
    async update(id, data) {
        const { data: updated, error } = await supabase_1.supabase
            .from(this.tableName)
            .update(this.mapToDb({ ...data, updatedAt: new Date().toISOString() }))
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return updated;
    }
    async delete(id) {
        const { error } = await supabase_1.supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);
        if (error)
            throw error;
        return true;
    }
}
exports.DeityRepository = DeityRepository;
