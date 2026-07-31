import { BaseRepository } from './base.repository';
import { db } from '@common/database/DatabaseClient';

export class ArticleRepository extends BaseRepository<any> {
  constructor() {
    super('articles');
  }

  public async getList(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    category?: string;
    author?: string;
    featured?: string;
    festival?: string;
    deity?: string;
    sort?: string;
  }) {
    const { page, limit, search, status, category, author, featured, sort } = params;
    const offset = (page - 1) * limit;

    let whereClauses = ['a.deleted_at IS NULL'];
    const queryParams: any[] = [];

    if (status) {
      queryParams.push(status);
      whereClauses.push(`a.status = $${queryParams.length}`);
    }
    if (category) {
      queryParams.push(category);
      whereClauses.push(`a.category_id = $${queryParams.length}`);
    }
    if (author) {
      queryParams.push(author);
      whereClauses.push(`a.author_id = $${queryParams.length}`);
    }
    if (featured === 'true') {
      whereClauses.push(`a.featured = true`);
    } else if (featured === 'false') {
      whereClauses.push(`a.featured = false`);
    }

    if (search) {
      queryParams.push(`%${search}%`);
      whereClauses.push(`(a.title ILIKE $${queryParams.length} OR a.content ILIKE $${queryParams.length})`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    let orderStr = 'ORDER BY a.created_at DESC';
    if (sort === 'oldest') orderStr = 'ORDER BY a.created_at ASC';
    else if (sort === 'views') orderStr = 'ORDER BY a.view_count DESC';

    const dataQuery = `
      SELECT 
        a.id, a.title, a.slug, a.status, a.featured, a.view_count, a.created_at, a.publish_date, a.category_id, a.author_id, a.featured_image_id,
        json_build_object('name', c.name) as categories,
        json_build_object('name', au.name) as authors,
        json_build_object('url', m.url) as media_files
      FROM ${this.tableName} a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN authors au ON a.author_id = au.id
      LEFT JOIN media_files m ON a.featured_image_id = m.id
      ${whereStr} 
      ${orderStr} 
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    
    const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} a ${whereStr}`;

    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, [...queryParams, limit, offset]),
      db.query(countQuery, queryParams)
    ]);

    return { data: dataResult.rows, count: parseInt(countResult.rows[0].total, 10) || 0 };
  }

  public async getByIdWithRelations(id: string) {
    const query = `
      SELECT 
        a.*,
        json_build_object('id', c.id, 'name', c.name) as categories,
        json_build_object('id', au.id, 'name', au.name) as authors,
        json_build_object('id', m.id, 'url', m.url, 'file_name', m.file_name) as media_files,
        COALESCE((SELECT json_agg(json_build_object('god_id', god_id)) FROM article_gods WHERE article_id = a.id), '[]'::json) as article_gods,
        COALESCE((SELECT json_agg(json_build_object('festival_id', festival_id)) FROM article_festivals WHERE article_id = a.id), '[]'::json) as article_festivals,
        COALESCE((SELECT json_agg(json_build_object('tag_id', tag_id)) FROM article_tags WHERE article_id = a.id), '[]'::json) as article_tags,
        COALESCE((SELECT json_agg(json_build_object('bhajan_id', bhajan_id)) FROM article_bhajans WHERE article_id = a.id), '[]'::json) as article_bhajans,
        COALESCE((SELECT json_agg(json_build_object('related_id', related_id)) FROM related_articles WHERE article_id = a.id), '[]'::json) as related_articles
      FROM ${this.tableName} a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN authors au ON a.author_id = au.id
      LEFT JOIN media_files m ON a.featured_image_id = m.id
      WHERE a.id = $1 AND a.deleted_at IS NULL
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
  }

  public async updateJunctionTable(tableName: string, articleId: string, foreignColumn: string, ids: string[]) {
    await db.query(`DELETE FROM ${tableName} WHERE article_id = $1`, [articleId]);
    if (ids && ids.length > 0) {
      const placeholders = ids.map((_, i) => `($1, $${i + 2})`).join(', ');
      const query = `INSERT INTO ${tableName} (article_id, ${foreignColumn}) VALUES ${placeholders}`;
      await db.query(query, [articleId, ...ids]);
    }
  }

  public async bulkAction(ids: string[], action: string) {
    if (ids.length === 0) return;
    
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    
    if (action === 'DELETE') {
      await db.query(`UPDATE ${this.tableName} SET deleted_at = NOW() WHERE id IN (${placeholders})`, ids);
    } else if (action === 'FEATURE' || action === 'UNFEATURE') {
      const featured = action === 'FEATURE';
      await db.query(`UPDATE ${this.tableName} SET featured = $1 WHERE id IN (${placeholders.replace(/\$(\d+)/g, (match, p1) => `$${parseInt(p1, 10) + 1}`)})`, [featured, ...ids]);
    } else {
      let status = 'DRAFT';
      if (action === 'PUBLISH') status = 'PUBLISHED';
      if (action === 'ARCHIVE') status = 'ARCHIVED';
      await db.query(`UPDATE ${this.tableName} SET status = $1 WHERE id IN (${placeholders.replace(/\$(\d+)/g, (match, p1) => `$${parseInt(p1, 10) + 1}`)})`, [status, ...ids]);
    }
  }
}

export const articleRepository = new ArticleRepository();
