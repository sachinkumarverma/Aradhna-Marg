import { db } from '@common/database/DatabaseClient';
import { Deity } from './DeityTypes';
import { CreateDeityDTO, UpdateDeityDTO, DeityQueryOptions } from './DeityDTO';

export class DeityRepository {
  private mapToModel(row: any): Deity {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      shortDescription: row.short_description,
      image: row.image,
      displayOrder: row.display_order,
      featured: row.featured,
      status: row.status,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }

  async findAll(options: DeityQueryOptions = {}) {
    const { page = 1, limit = 10, search = '' } = options;
    const offset = (page - 1) * limit;

    const searchParam = `%${search}%`;

    const dataQuery = `
      SELECT * FROM deities
      WHERE name ILIKE $1 OR slug ILIKE $1
      ORDER BY display_order ASC, created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total FROM deities
      WHERE name ILIKE $1 OR slug ILIKE $1;
    `;

    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, [searchParam, limit, offset]),
      db.query(countQuery, [searchParam])
    ]);

    const total = parseInt(countResult.rows[0].total, 10);
    return {
      data: dataResult.rows.map(this.mapToModel),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findById(id: string) {
    const query = `SELECT * FROM deities WHERE id = $1;`;
    const result = await db.query(query, [id]);
    if (result.rowCount === 0) throw new Error('Deity not found');
    return this.mapToModel(result.rows[0]);
  }

  async findBySlug(slug: string) {
    const query = `SELECT * FROM deities WHERE slug = $1;`;
    const result = await db.query(query, [slug]);
    if (result.rowCount === 0) throw new Error('Deity not found');
    return this.mapToModel(result.rows[0]);
  }

  async create(data: CreateDeityDTO) {
    const query = `
      INSERT INTO deities (
        name, slug, short_description, image, display_order, featured, status,
        seo_title, seo_description, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *;
    `;
    const params = [
      data.name, data.slug, data.shortDescription, data.image, data.displayOrder || 0,
      data.featured || false, data.status || 'ACTIVE', data.seoTitle, data.seoDescription,
      data.createdBy
    ];

    const result = await db.query(query, params);
    return this.mapToModel(result.rows[0]);
  }

  async update(id: string, data: UpdateDeityDTO) {
    const query = `
      UPDATE deities
      SET
        name = COALESCE($2, name),
        slug = COALESCE($3, slug),
        short_description = COALESCE($4, short_description),
        image = COALESCE($5, image),
        display_order = COALESCE($6, display_order),
        featured = COALESCE($7, featured),
        status = COALESCE($8, status),
        seo_title = COALESCE($9, seo_title),
        seo_description = COALESCE($10, seo_description),
        updated_by = COALESCE($11, updated_by),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const params = [
      id, data.name, data.slug, data.shortDescription, data.image, data.displayOrder,
      data.featured, data.status, data.seoTitle, data.seoDescription, data.updatedBy
    ];

    const result = await db.query(query, params);
    if (result.rowCount === 0) throw new Error('Deity not found');
    return this.mapToModel(result.rows[0]);
  }

  async delete(id: string) {
    const query = `DELETE FROM deities WHERE id = $1;`;
    await db.query(query, [id]);
    return true;
  }
}

export const deityRepository = new DeityRepository();
