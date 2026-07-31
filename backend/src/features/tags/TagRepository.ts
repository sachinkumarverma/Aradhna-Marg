import { db } from '@common/database/DatabaseClient';
import { Tag } from './TagTypes';
import { TagQueryOptions, CreateTagDTO, UpdateTagDTO } from './TagDTO';
import { ConflictError } from '@/errors/appError';

export class TagRepository {
  private mapToModel(row: any): Tag {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      color: row.color,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }

  async findAll(options: TagQueryOptions = {}): Promise<{ data: Tag[]; total: number }> {
    const { search = '', sort = 'created_at', order = 'desc', page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;

    const searchParam = `%${search}%`;

    let orderByColumn = 'created_at';
    if (sort === 'name') orderByColumn = 'name';
    
    const orderDirection = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let statusCondition = '';
    const params: any[] = [searchParam, limit, offset];
    if (status) {
      statusCondition = 'AND status = $4';
      params.push(status);
    }

    const dataQuery = `
      SELECT * FROM tags
      WHERE (name ILIKE $1 OR description ILIKE $1)
      ${statusCondition}
      ORDER BY ${orderByColumn} ${orderDirection}
      LIMIT $2 OFFSET $3;
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total FROM tags
      WHERE (name ILIKE $1 OR description ILIKE $1)
      ${statusCondition ? 'AND status = $2' : ''};
    `;

    const countParams = status ? [searchParam, status] : [searchParam];

    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, params),
      db.query(countQuery, countParams),
    ]);

    const total = parseInt(countResult.rows[0].total, 10);
    return { data: dataResult.rows.map(this.mapToModel), total };
  }

  async findById(id: string): Promise<Tag | null> {
    const query = `SELECT * FROM tags WHERE id = $1;`;
    const result = await db.query(query, [id]);
    if (result.rowCount === 0) return null;
    return this.mapToModel(result.rows[0]);
  }

  async create(dto: CreateTagDTO): Promise<Tag> {
    const query = `
      INSERT INTO tags (
        name, slug, description, color, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *;
    `;
    const params = [
      dto.name, dto.slug, dto.description || null, dto.color || null, dto.status || 'ACTIVE'
    ];

    try {
      const result = await db.query(query, params);
      return this.mapToModel(result.rows[0]);
    } catch (error: any) {
      if (error.code === '23505') throw new ConflictError('Tag slug already exists');
      throw error;
    }
  }

  async update(id: string, dto: UpdateTagDTO): Promise<Tag> {
    const query = `
      UPDATE tags
      SET 
        name = COALESCE($2, name),
        slug = COALESCE($3, slug),
        description = COALESCE($4, description),
        color = COALESCE($5, color),
        status = COALESCE($6, status),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const params = [
      id, dto.name, dto.slug, dto.description, dto.color, dto.status
    ];

    try {
      const result = await db.query(query, params);
      return this.mapToModel(result.rows[0]);
    } catch (error: any) {
      if (error.code === '23505') throw new ConflictError('Tag slug already exists');
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const query = `DELETE FROM tags WHERE id = $1;`;
    await db.query(query, [id]);
  }
}

export const tagRepository = new TagRepository();
