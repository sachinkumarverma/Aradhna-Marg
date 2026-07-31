"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.festivalRepository = exports.FestivalRepository = void 0;
const supabase_1 = require("../database/supabase");
const appError_1 = require("../errors/appError");
class FestivalRepository {
    tableName = 'festivals';
    mapToModel(row) {
        return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            shortDescription: row.short_description,
            content: row.content,
            bannerImage: row.banner_image,
            festivalDate: row.festival_date,
            category: row.category,
            featured: row.featured,
            status: row.status,
            seoTitle: row.seo_title,
            seoDescription: row.seo_description,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at,
            bhajanIds: row.festival_bhajans?.map((fb) => fb.bhajan_id) || [],
            articleIds: row.festival_articles?.map((fa) => fa.article_id) || [],
        };
    }
    mapToDb(dto) {
        const dbData = {};
        if (dto.name !== undefined)
            dbData.name = dto.name;
        if (dto.slug !== undefined)
            dbData.slug = dto.slug;
        if (dto.shortDescription !== undefined)
            dbData.short_description = dto.shortDescription;
        if (dto.content !== undefined)
            dbData.content = dto.content;
        if (dto.bannerImage !== undefined)
            dbData.banner_image = dto.bannerImage;
        if (dto.festivalDate !== undefined)
            dbData.festival_date = dto.festivalDate;
        if (dto.category !== undefined)
            dbData.category = dto.category;
        if (dto.featured !== undefined)
            dbData.featured = dto.featured;
        if (dto.status !== undefined)
            dbData.status = dto.status;
        if (dto.seoTitle !== undefined)
            dbData.seo_title = dto.seoTitle;
        if (dto.seoDescription !== undefined)
            dbData.seo_description = dto.seoDescription;
        return dbData;
    }
    async findAll(options = {}) {
        const { search, sort = 'created_at', order = 'desc', page = 1, limit = 10 } = options;
        const offset = (page - 1) * limit;
        let query = supabase_1.supabase
            .from(this.tableName)
            .select('*, festival_bhajans(bhajan_id), festival_articles(article_id)', { count: 'exact' });
        if (search) {
            query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
        }
        query = query.order(sort === 'name' ? 'name' : sort === 'festivalDate' ? 'festival_date' : 'created_at', { ascending: order === 'asc' });
        query = query.range(offset, offset + limit - 1);
        const { data, error, count } = await query;
        if (error)
            throw error;
        return { data: data.map((d) => this.mapToModel(d)), total: count || 0 };
    }
    async findById(id) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*, festival_bhajans(bhajan_id), festival_articles(article_id)')
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116')
            throw error;
        if (!data)
            return null;
        return this.mapToModel(data);
    }
    async create(dto) {
        const dbData = this.mapToDb(dto);
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert([dbData])
            .select()
            .single();
        if (error) {
            if (error.code === '23505')
                throw new appError_1.ConflictError('Festival slug already exists');
            throw error;
        }
        await this.updateRelations(data.id, dto.bhajanIds, dto.articleIds);
        return this.findById(data.id);
    }
    async update(id, dto) {
        const dbData = this.mapToDb(dto);
        dbData.updated_at = new Date().toISOString();
        const { error } = await supabase_1.supabase
            .from(this.tableName)
            .update(dbData)
            .eq('id', id);
        if (error) {
            if (error.code === '23505')
                throw new appError_1.ConflictError('Festival slug already exists');
            throw error;
        }
        await this.updateRelations(id, dto.bhajanIds, dto.articleIds);
        return this.findById(id);
    }
    async delete(id) {
        const { error } = await supabase_1.supabase.from(this.tableName).delete().eq('id', id);
        if (error)
            throw error;
    }
    async bulkAction(ids, action) {
        if (action === 'delete') {
            const { error } = await supabase_1.supabase.from(this.tableName).delete().in('id', ids);
            if (error)
                throw error;
        }
        else {
            const status = action === 'publish' ? 'Published' : 'Draft';
            const { error } = await supabase_1.supabase.from(this.tableName).update({ status, updated_at: new Date().toISOString() }).in('id', ids);
            if (error)
                throw error;
        }
    }
    async updateRelations(festivalId, bhajanIds, articleIds) {
        if (bhajanIds !== undefined) {
            await supabase_1.supabase.from('festival_bhajans').delete().eq('festival_id', festivalId);
            if (bhajanIds.length > 0) {
                const bhajanInserts = bhajanIds.map(id => ({ festival_id: festivalId, bhajan_id: id }));
                await supabase_1.supabase.from('festival_bhajans').insert(bhajanInserts);
            }
        }
        if (articleIds !== undefined) {
            await supabase_1.supabase.from('festival_articles').delete().eq('festival_id', festivalId);
            if (articleIds.length > 0) {
                const articleInserts = articleIds.map(id => ({ festival_id: festivalId, article_id: id }));
                await supabase_1.supabase.from('festival_articles').insert(articleInserts);
            }
        }
    }
}
exports.FestivalRepository = FestivalRepository;
exports.festivalRepository = new FestivalRepository();
