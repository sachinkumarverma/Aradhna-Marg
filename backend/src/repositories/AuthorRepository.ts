import { db } from '@common/database/DatabaseClient';
import { Author, CreateAuthorDTO, UpdateAuthorDTO } from '@models/Author';
import { ConflictError, NotFoundError } from '@/errors/appError';

export class AuthorRepository {
  private readonly tableName = 'authors';

  private mapToModel(row: any): Author {
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

  private mapToDb(dto: Partial<CreateAuthorDTO>): any {
    const dbData: any = {};
    if (dto.name !== undefined) dbData.name = dto.name;
    if (dto.photo !== undefined) dbData.photo = dto.photo;
    if (dto.shortDescription !== undefined) dbData.short_description = dto.shortDescription;
    if (dto.status !== undefined) dbData.status = dto.status;
    if (dto.seoTitle !== undefined) dbData.seo_title = dto.seoTitle;
    if (dto.seoDescription !== undefined) dbData.seo_description = dto.seoDescription;
    return dbData;
  }

  async findAll(options: { search?: string, sort?: string, order?: 'asc' | 'desc', page?: number, limit?: number, status?: string } = {}): Promise<{ data: Author[], total: number }> {
    const { search, sort = 'created_at', order = 'desc', page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;

    let whereClauses = ['deleted_at IS NULL'];
    const queryParams: any[] = [];

    if (search) {
      queryParams.push(`%${search}%`);
      whereClauses.push(`name ILIKE $${queryParams.length}`);
    }

    if (status) {
      queryParams.push(status);
      whereClauses.push(`status = $${queryParams.length}`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const orderStr = sort === 'name' 
      ? `ORDER BY name ${order === 'asc' ? 'ASC' : 'DESC'}`
      : `ORDER BY created_at ${order === 'asc' ? 'ASC' : 'DESC'}`;

    const dataQuery = `SELECT * FROM ${this.tableName} ${whereStr} ${orderStr} LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereStr}`;

    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, [...queryParams, limit, offset]),
      db.query(countQuery, queryParams)
    ]);
    
    return { data: dataResult.rows.map(this.mapToModel), total: parseInt(countResult.rows[0].total, 10) || 0 };
  }

  async findById(id: string): Promise<Author | null> {
    const { rows } = await db.query(`SELECT * FROM ${this.tableName} WHERE id = $1 AND deleted_at IS NULL LIMIT 1`, [id]);
    if (rows.length === 0) return null;
    return this.mapToModel(rows[0]);
  }

  async create(dto: CreateAuthorDTO): Promise<Author> {
    const dbData = this.mapToDb(dto);
    const keys = Object.keys(dbData);
    const values = Object.values(dbData);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const query = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await db.query(query, values);
    
    return this.mapToModel(rows[0]);
  }

  async update(id: string, dto: UpdateAuthorDTO): Promise<Author> {
    const dbData = this.mapToDb(dto);
    dbData.updated_at = new Date().toISOString();

    const keys = Object.keys(dbData);
    const values = Object.values(dbData);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    values.push(id);

    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = $${values.length} RETURNING *`;
    const { rows } = await db.query(query, values);
    
    return this.mapToModel(rows[0]);
  }

  async delete(id: string): Promise<void> {
    await db.query(`UPDATE ${this.tableName} SET deleted_at = NOW() WHERE id = $1`, [id]);
  }
}

export const authorRepository = new AuthorRepository();
