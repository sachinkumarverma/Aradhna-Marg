import { db } from '@common/database/DatabaseClient';
import { Festival, CreateFestivalDTO, UpdateFestivalDTO } from '@models/Festival';
import { ConflictError, NotFoundError } from '@/errors/appError';

export class FestivalRepository {
  private readonly tableName = 'festivals';

  private mapToModel(row: any): Festival {
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
      bhajanIds: row.festival_bhajans?.map((fb: any) => fb.bhajan_id) || [],
      articleIds: row.festival_articles?.map((fa: any) => fa.article_id) || [],
    };
  }

  private mapToDb(dto: Partial<CreateFestivalDTO>): any {
    const dbData: any = {};
    if (dto.name !== undefined) dbData.name = dto.name;
    if (dto.slug !== undefined) dbData.slug = dto.slug;
    if (dto.shortDescription !== undefined) dbData.short_description = dto.shortDescription;
    if (dto.content !== undefined) dbData.content = dto.content;
    if (dto.bannerImage !== undefined) dbData.banner_image = dto.bannerImage;
    if (dto.festivalDate !== undefined) dbData.festival_date = dto.festivalDate;
    if (dto.category !== undefined) dbData.category = dto.category;
    if (dto.featured !== undefined) dbData.featured = dto.featured;
    if (dto.status !== undefined) dbData.status = dto.status;
    if (dto.seoTitle !== undefined) dbData.seo_title = dto.seoTitle;
    if (dto.seoDescription !== undefined) dbData.seo_description = dto.seoDescription;
    
    // English fields
    if ((dto as any).name_en !== undefined) dbData.name_en = (dto as any).name_en;
    if ((dto as any).seoTitle_en !== undefined) dbData.seo_title_en = (dto as any).seoTitle_en;
    if ((dto as any).seoDescription_en !== undefined) dbData.seo_description_en = (dto as any).seoDescription_en;
    
    return dbData;
  }

  async findAll(options: { search?: string, sort?: string, order?: 'asc' | 'desc', page?: number, limit?: number } = {}): Promise<{ data: Festival[], total: number }> {
    const { search, sort = 'created_at', order = 'desc', page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    let whereClauses: string[] = [];
    const queryParams: any[] = [];

    if (search) {
      queryParams.push(`%${search}%`);
      whereClauses.push(`(name ILIKE $${queryParams.length} OR slug ILIKE $${queryParams.length})`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    let orderStr = 'ORDER BY created_at DESC';
    if (sort === 'name') orderStr = `ORDER BY name ${order === 'asc' ? 'ASC' : 'DESC'}`;
    else if (sort === 'festivalDate') orderStr = `ORDER BY festival_date ${order === 'asc' ? 'ASC' : 'DESC'}`;
    else if (sort === 'created_at') orderStr = `ORDER BY created_at ${order === 'asc' ? 'ASC' : 'DESC'}`;

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
      db.query(dataQuery, [...queryParams, limit, offset]),
      db.query(countQuery, queryParams)
    ]);

    return { data: dataResult.rows.map((d: any) => this.mapToModel(d)), total: parseInt(countResult.rows[0].total, 10) || 0 };
  }

  async findById(id: string): Promise<Festival | null> {
    const query = `
      SELECT 
        f.*,
        COALESCE((SELECT json_agg(json_build_object('bhajan_id', bhajan_id)) FROM festival_bhajans WHERE festival_id = f.id), '[]'::json) as festival_bhajans,
        COALESCE((SELECT json_agg(json_build_object('article_id', article_id)) FROM festival_articles WHERE festival_id = f.id), '[]'::json) as festival_articles
      FROM ${this.tableName} f
      WHERE f.id = $1
    `;
    const { rows } = await db.query(query, [id]);
    if (rows.length === 0) return null;
    return this.mapToModel(rows[0]);
  }

  async create(dto: CreateFestivalDTO): Promise<Festival> {
    const dbData = this.mapToDb(dto);
    const keys = Object.keys(dbData);
    const values = Object.values(dbData);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    try {
      const query = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING id`;
      const { rows } = await db.query(query, values);
      
      await this.updateRelations(rows[0].id, dto.bhajanIds, dto.articleIds);
      return this.findById(rows[0].id) as Promise<Festival>;
    } catch (error: any) {
      if (error.code === '23505') throw new ConflictError('Festival slug already exists');
      throw error;
    }
  }

  async update(id: string, dto: UpdateFestivalDTO): Promise<Festival> {
    const dbData = this.mapToDb(dto);
    dbData.updated_at = new Date().toISOString();
    
    const keys = Object.keys(dbData);
    const values = Object.values(dbData);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    values.push(id);

    try {
      const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = $${values.length} RETURNING id`;
      await db.query(query, values);
      
      await this.updateRelations(id, dto.bhajanIds, dto.articleIds);
      return this.findById(id) as Promise<Festival>;
    } catch (error: any) {
      if (error.code === '23505') throw new ConflictError('Festival slug already exists');
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await db.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
  }
  
  async bulkAction(ids: string[], action: 'publish' | 'draft' | 'delete'): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    
    if (action === 'delete') {
      await db.query(`DELETE FROM ${this.tableName} WHERE id IN (${placeholders})`, ids);
    } else {
      const status = action === 'publish' ? 'Published' : 'Draft';
      await db.query(`UPDATE ${this.tableName} SET status = $1, updated_at = NOW() WHERE id IN (${placeholders.replace(/\$(\d+)/g, (match, p1) => `$${parseInt(p1, 10) + 1}`)})`, [status, ...ids]);
    }
  }

  private async updateRelations(festivalId: string, bhajanIds?: string[], articleIds?: string[]) {
    if (bhajanIds !== undefined) {
      await db.query(`DELETE FROM festival_bhajans WHERE festival_id = $1`, [festivalId]);
      if (bhajanIds.length > 0) {
        const placeholders = bhajanIds.map((_, i) => `($1, $${i + 2})`).join(', ');
        await db.query(`INSERT INTO festival_bhajans (festival_id, bhajan_id) VALUES ${placeholders}`, [festivalId, ...bhajanIds]);
      }
    }

    if (articleIds !== undefined) {
      await db.query(`DELETE FROM festival_articles WHERE festival_id = $1`, [festivalId]);
      if (articleIds.length > 0) {
        const placeholders = articleIds.map((_, i) => `($1, $${i + 2})`).join(', ');
        await db.query(`INSERT INTO festival_articles (festival_id, article_id) VALUES ${placeholders}`, [festivalId, ...articleIds]);
      }
    }
  }
}

export const festivalRepository = new FestivalRepository();
