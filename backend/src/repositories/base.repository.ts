import { db } from '@common/database/DatabaseClient';
import { IBaseRepository } from '@/interfaces/repositories';

export class BaseRepository<T> implements IBaseRepository<T> {
  protected readonly tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  public async findAll(options?: { select?: string; order?: { column: string; ascending?: boolean } }): Promise<T[]> {
    const selectStr = options?.select || '*';
    let query = `SELECT ${selectStr} FROM ${this.tableName} WHERE deleted_at IS NULL`;
    
    if (options?.order) {
      const orderDir = options.order.ascending ?? true ? 'ASC' : 'DESC';
      query += ` ORDER BY ${options.order.column} ${orderDir}`;
    }

    const { rows } = await db.query(query);
    return rows as unknown as T[];
  }

  public async findById(id: string): Promise<T | null> {
    const { rows } = await db.query(`SELECT * FROM ${this.tableName} WHERE id = $1 AND deleted_at IS NULL LIMIT 1`, [id]);
    return (rows[0] as unknown as T) || null;
  }

  public async findBySlug(slug: string): Promise<T | null> {
    const { rows } = await db.query(`SELECT * FROM ${this.tableName} WHERE slug = $1 AND deleted_at IS NULL LIMIT 1`, [slug]);
    return (rows[0] as unknown as T) || null;
  }

  public async create(data: Partial<T>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await db.query(query, values);
    return rows[0] as unknown as T;
  }

  public async update(id: string, data: Partial<T>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    values.push(id); // ID is the last parameter
    
    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = $${values.length} RETURNING *`;
    const { rows } = await db.query(query, values);
    return rows[0] as unknown as T;
  }

  public async delete(id: string): Promise<boolean> {
    await db.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
    return true;
  }

  public async paginate(page: number, limit: number, filters?: Record<string, any>): Promise<{ data: T[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    
    let whereClauses = ['deleted_at IS NULL'];
    const params: any[] = [];
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          whereClauses.push(`${key} = $${params.length + 1}`);
          params.push(value);
        }
      });
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    const dataQuery = `SELECT * FROM ${this.tableName} ${whereStr} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereStr}`;

    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, [...params, limit, offset]),
      db.query(countQuery, params)
    ]);
    
    return {
      data: (dataResult.rows as unknown as T[]) || [],
      total: parseInt(countResult.rows[0].total, 10) || 0,
      page,
      limit,
    };
  }

  public async search(queryText: string, options?: { select?: string, limit?: number }): Promise<T[]> {
    const selectStr = options?.select || '*';
    const limit = options?.limit || 20;
    
    // Very basic fallback since full text search requires specific columns.
    const query = `
      SELECT ${selectStr} FROM ${this.tableName} 
      WHERE deleted_at IS NULL AND (
        title ILIKE $1 OR description ILIKE $1
      )
      LIMIT $2
    `;
    
    const { rows } = await db.query(query, [`%${queryText}%`, limit]);
    return rows as unknown as T[];
  }
}
