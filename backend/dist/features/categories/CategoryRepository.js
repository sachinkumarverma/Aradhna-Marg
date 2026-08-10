"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryRepository = exports.CategoryRepository = void 0;
const DatabaseClient_1 = require("@common/database/DatabaseClient");
// Using the types from the interfaces
const appError_1 = require("@/errors/appError");
class CategoryRepository {
    mapToModel(row) {
        return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            imageUrl: row.image_url,
            iconUrl: row.icon_url,
            seoTitle: row.seo_title,
            seoDescription: row.seo_description,
            displayOrder: row.display_order,
            status: row.status,
            showInNavigation: row.show_in_navigation,
            isFeatured: row.is_featured,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            bhajanCount: row.bhajan_count || 0,
        };
    }
    async findAll(options = {}) {
        const { search = '', sort = 'created_at', order = 'desc', page = 1, limit = 10 } = options;
        const offset = (page - 1) * limit;
        const searchParam = `%${search}%`;
        let orderByColumn = 'created_at';
        if (sort === 'name')
            orderByColumn = 'name';
        if (sort === 'displayOrder')
            orderByColumn = 'display_order';
        const orderDirection = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const dataQuery = `
      SELECT * FROM categories
      WHERE name ILIKE $1 OR slug ILIKE $1
      ORDER BY ${orderByColumn} ${orderDirection}
      LIMIT $2 OFFSET $3;
    `;
        const countQuery = `
      SELECT COUNT(*) as total FROM categories
      WHERE name ILIKE $1 OR slug ILIKE $1;
    `;
        const [dataResult, countResult] = await Promise.all([
            DatabaseClient_1.db.query(dataQuery, [searchParam, limit, offset]),
            DatabaseClient_1.db.query(countQuery, [searchParam]),
        ]);
        const total = parseInt(countResult.rows[0].total, 10);
        return { data: dataResult.rows.map(this.mapToModel), total };
    }
    async findById(id) {
        const query = `SELECT * FROM categories WHERE id = $1;`;
        const result = await DatabaseClient_1.db.query(query, [id]);
        if (result.rowCount === 0)
            return null;
        return this.mapToModel(result.rows[0]);
    }
    async create(dto) {
        const query = `
      INSERT INTO categories (
        name, slug, description, image_url, icon_url, seo_title, seo_description, 
        display_order, status, show_in_navigation, is_featured, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *;
    `;
        const params = [
            dto.name, dto.slug, dto.description || null, dto.imageUrl || null, dto.iconUrl || null,
            dto.seoTitle || null, dto.seoDescription || null, dto.displayOrder || 0,
            dto.status || 'PUBLISHED', dto.showInNavigation ?? true, dto.isFeatured ?? false
        ];
        try {
            const result = await DatabaseClient_1.db.query(query, params);
            return this.mapToModel(result.rows[0]);
        }
        catch (error) {
            if (error.code === '23505')
                throw new appError_1.ConflictError('Category slug already exists');
            throw error;
        }
    }
    async update(id, dto) {
        const query = `
      UPDATE categories
      SET 
        name = COALESCE($2, name),
        slug = COALESCE($3, slug),
        description = COALESCE($4, description),
        image_url = COALESCE($5, image_url),
        icon_url = COALESCE($6, icon_url),
        seo_title = COALESCE($7, seo_title),
        seo_description = COALESCE($8, seo_description),
        display_order = COALESCE($9, display_order),
        status = COALESCE($10, status),
        show_in_navigation = COALESCE($11, show_in_navigation),
        is_featured = COALESCE($12, is_featured),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
        const params = [
            id, dto.name, dto.slug, dto.description, dto.imageUrl, dto.iconUrl,
            dto.seoTitle, dto.seoDescription, dto.displayOrder, dto.status,
            dto.showInNavigation, dto.isFeatured
        ];
        try {
            const result = await DatabaseClient_1.db.query(query, params);
            return this.mapToModel(result.rows[0]);
        }
        catch (error) {
            if (error.code === '23505')
                throw new appError_1.ConflictError('Category slug already exists');
            throw error;
        }
    }
    async delete(id) {
        const query = `DELETE FROM categories WHERE id = $1;`;
        await DatabaseClient_1.db.query(query, [id]);
    }
}
exports.CategoryRepository = CategoryRepository;
exports.categoryRepository = new CategoryRepository();
