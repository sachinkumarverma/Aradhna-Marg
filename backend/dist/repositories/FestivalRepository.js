"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.festivalRepository = exports.FestivalRepository = void 0;
const DatabaseClient_1 = require("../common/database/DatabaseClient");
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
        let whereClauses = ['deleted_at IS NULL'];
        const queryParams = [];
        if (search) {
            queryParams.push(`%${search}%`);
            whereClauses.push(`(name ILIKE $${queryParams.length} OR slug ILIKE $${queryParams.length})`);
        }
        const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        let orderStr = 'ORDER BY created_at DESC';
        if (sort === 'name')
            orderStr = `ORDER BY name ${order === 'asc' ? 'ASC' : 'DESC'}`;
        else if (sort === 'festivalDate')
            orderStr = `ORDER BY festival_date ${order === 'asc' ? 'ASC' : 'DESC'}`;
        else if (sort === 'created_at')
            orderStr = `ORDER BY created_at ${order === 'asc' ? 'ASC' : 'DESC'}`;
        const dataQuery = `
      SELECT 
        f.*,
        COALESCE((SELECT json_agg(json_build_object('bhajan_id', bhajan_id)) FROM festival_bhajans WHERE festival_id = f.id), '[]'::json) as festival_bhajans,
        COALESCE((SELECT json_agg(json_build_object('article_id', article_id)) FROM festival_articles WHERE festival_id = f.id), '[]'::json) as festival_articles
      FROM ${this.tableName} f
      ${whereStr} 
      ${orderStr} 
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
        const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} f ${whereStr}`;
        const [dataResult, countResult] = await Promise.all([
            DatabaseClient_1.db.query(dataQuery, [...queryParams, limit, offset]),
            DatabaseClient_1.db.query(countQuery, queryParams)
        ]);
        return { data: dataResult.rows.map((d) => this.mapToModel(d)), total: parseInt(countResult.rows[0].total, 10) || 0 };
    }
    async findById(id) {
        const query = `
      SELECT 
        f.*,
        COALESCE((SELECT json_agg(json_build_object('bhajan_id', bhajan_id)) FROM festival_bhajans WHERE festival_id = f.id), '[]'::json) as festival_bhajans,
        COALESCE((SELECT json_agg(json_build_object('article_id', article_id)) FROM festival_articles WHERE festival_id = f.id), '[]'::json) as festival_articles
      FROM ${this.tableName} f
      WHERE f.id = $1 AND f.deleted_at IS NULL
    `;
        const { rows } = await DatabaseClient_1.db.query(query, [id]);
        if (rows.length === 0)
            return null;
        return this.mapToModel(rows[0]);
    }
    async create(dto) {
        const dbData = this.mapToDb(dto);
        const keys = Object.keys(dbData);
        const values = Object.values(dbData);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        try {
            const query = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING id`;
            const { rows } = await DatabaseClient_1.db.query(query, values);
            await this.updateRelations(rows[0].id, dto.bhajanIds, dto.articleIds);
            return this.findById(rows[0].id);
        }
        catch (error) {
            if (error.code === '23505')
                throw new appError_1.ConflictError('Festival slug already exists');
            throw error;
        }
    }
    async update(id, dto) {
        const dbData = this.mapToDb(dto);
        dbData.updated_at = new Date().toISOString();
        const keys = Object.keys(dbData);
        const values = Object.values(dbData);
        const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
        values.push(id);
        try {
            const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = $${values.length} RETURNING id`;
            await DatabaseClient_1.db.query(query, values);
            await this.updateRelations(id, dto.bhajanIds, dto.articleIds);
            return this.findById(id);
        }
        catch (error) {
            if (error.code === '23505')
                throw new appError_1.ConflictError('Festival slug already exists');
            throw error;
        }
    }
    async delete(id) {
        await DatabaseClient_1.db.query(`UPDATE ${this.tableName} SET deleted_at = NOW() WHERE id = $1`, [id]);
    }
    async bulkAction(ids, action) {
        if (ids.length === 0)
            return;
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
        if (action === 'delete') {
            await DatabaseClient_1.db.query(`UPDATE ${this.tableName} SET deleted_at = NOW() WHERE id IN (${placeholders})`, ids);
        }
        else {
            const status = action === 'publish' ? 'Published' : 'Draft';
            await DatabaseClient_1.db.query(`UPDATE ${this.tableName} SET status = $1, updated_at = NOW() WHERE id IN (${placeholders.replace(/\$(\d+)/g, (match, p1) => `$${parseInt(p1, 10) + 1}`)})`, [status, ...ids]);
        }
    }
    async updateRelations(festivalId, bhajanIds, articleIds) {
        if (bhajanIds !== undefined) {
            await DatabaseClient_1.db.query(`DELETE FROM festival_bhajans WHERE festival_id = $1`, [festivalId]);
            if (bhajanIds.length > 0) {
                const placeholders = bhajanIds.map((_, i) => `($1, $${i + 2})`).join(', ');
                await DatabaseClient_1.db.query(`INSERT INTO festival_bhajans (festival_id, bhajan_id) VALUES ${placeholders}`, [festivalId, ...bhajanIds]);
            }
        }
        if (articleIds !== undefined) {
            await DatabaseClient_1.db.query(`DELETE FROM festival_articles WHERE festival_id = $1`, [festivalId]);
            if (articleIds.length > 0) {
                const placeholders = articleIds.map((_, i) => `($1, $${i + 2})`).join(', ');
                await DatabaseClient_1.db.query(`INSERT INTO festival_articles (festival_id, article_id) VALUES ${placeholders}`, [festivalId, ...articleIds]);
            }
        }
    }
}
exports.FestivalRepository = FestivalRepository;
exports.festivalRepository = new FestivalRepository();
