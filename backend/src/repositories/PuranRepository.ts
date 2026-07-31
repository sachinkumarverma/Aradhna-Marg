import { BaseRepository } from './base.repository';
import { db } from '@common/database/DatabaseClient';

export class PuranRepository extends BaseRepository<any> {
  constructor() {
    super('puranas');
  }

  public async getList(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    language?: string;
    sort?: string;
  }) {
    const { page, limit, search, status, language, sort } = params;
    const offset = (page - 1) * limit;

    let whereClauses = ['deleted_at IS NULL'];
    const queryParams: any[] = [];

    if (status) {
      queryParams.push(status);
      whereClauses.push(`status = $${queryParams.length}`);
    }
    if (language) {
      queryParams.push(language);
      whereClauses.push(`language = $${queryParams.length}`);
    }
    
    if (search) {
      queryParams.push(`%${search}%`);
      whereClauses.push(`(title ILIKE $${queryParams.length} OR short_description ILIKE $${queryParams.length})`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    let orderStr = 'ORDER BY created_at DESC';
    if (sort === 'oldest') orderStr = 'ORDER BY created_at ASC';
    else if (sort === 'downloads') orderStr = 'ORDER BY download_count DESC';
    else if (sort === 'views') orderStr = 'ORDER BY view_count DESC';
    else if (sort === 'alphabetical') orderStr = 'ORDER BY title ASC';

    const dataQuery = `SELECT * FROM ${this.tableName} ${whereStr} ${orderStr} LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereStr}`;

    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, [...queryParams, limit, offset]),
      db.query(countQuery, queryParams)
    ]);

    return { data: dataResult.rows, count: parseInt(countResult.rows[0].total, 10) || 0 };
  }

  public async getById(id: string) {
    const { rows } = await db.query(`SELECT * FROM ${this.tableName} WHERE id = $1 AND deleted_at IS NULL LIMIT 1`, [id]);
    return rows[0] || null;
  }

  public async bulkAction(ids: string[], action: string) {
    if (ids.length === 0) return;
    
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    
    if (action === 'DELETE') {
      await db.query(`UPDATE ${this.tableName} SET deleted_at = NOW() WHERE id IN (${placeholders})`, ids);
    } else {
      let status = 'DRAFT';
      if (action === 'PUBLISH') status = 'PUBLISHED';
      if (action === 'ARCHIVE') status = 'ARCHIVED';
      await db.query(`UPDATE ${this.tableName} SET status = $1 WHERE id IN (${placeholders.replace(/\$(\d+)/g, (match, p1) => `$${parseInt(p1, 10) + 1}`)})`, [status, ...ids]);
    }
  }

  public async getBySlug(slug: string) {
    const { rows } = await db.query(`SELECT * FROM ${this.tableName} WHERE slug = $1 AND status = 'PUBLISHED' AND deleted_at IS NULL LIMIT 1`, [slug]);
    return rows[0] || null;
  }

  public async getRelated(id: string, language: string, limit = 4) {
    const { rows } = await db.query(
      `SELECT id, title, slug, language, cover_image, short_description 
       FROM ${this.tableName} 
       WHERE status = 'PUBLISHED' AND deleted_at IS NULL AND id != $1 AND language = $2 
       ORDER BY created_at DESC 
       LIMIT $3`,
      [id, language, limit]
    );
    return rows;
  }

  public async incrementStats(id: string, field: 'view_count' | 'download_count') {
    const fieldName = field === 'view_count' ? 'view_count' : 'download_count';
    await db.query(`UPDATE ${this.tableName} SET ${fieldName} = COALESCE(${fieldName}, 0) + 1 WHERE id = $1`, [id]);
  }
}

export const puranRepository = new PuranRepository();
