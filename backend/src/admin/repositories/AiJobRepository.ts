import { db } from '../../common/database/DatabaseClient';
import { AiJob, CreateAiJobDTO } from '../../models/AiJob';
import { NotFoundError } from '../../errors/appError';

export class AiJobRepository {
  private tableName = 'ai_jobs';

  async findAll(page: number = 1, limit: number = 10, status?: string): Promise<{ data: AiJob[]; count: number }> {
    const offset = (page - 1) * limit;
    const params: any[] = [];
    let whereClause = '';

    if (status) {
      params.push(status);
      whereClause = `WHERE status = $1`;
    }

    const dataQuery = `
      SELECT * FROM ${this.tableName}
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*) as total FROM ${this.tableName}
      ${whereClause}
    `;

    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, [...params, limit, offset]),
      db.query(countQuery, params)
    ]);

    return { 
      data: dataResult.rows as AiJob[], 
      count: parseInt(countResult.rows[0].total, 10) 
    };
  }
  
  async getStats(): Promise<any> {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString();
    
    const queries = [
      `SELECT COUNT(*) as total FROM ${this.tableName} WHERE status = 'PENDING'`,
      `SELECT COUNT(*) as total FROM ${this.tableName} WHERE status = 'PROCESSING'`,
      `SELECT COUNT(*) as total FROM ${this.tableName} WHERE status = 'COMPLETED'`,
      `SELECT COUNT(*) as total FROM ${this.tableName} WHERE status = 'FAILED'`,
      `SELECT COUNT(*) as total FROM ${this.tableName} WHERE created_at >= $1`
    ];

    const results = await Promise.all([
      db.query(queries[0]),
      db.query(queries[1]),
      db.query(queries[2]),
      db.query(queries[3]),
      db.query(queries[4], [todayStr])
    ]);
    
    return {
      pending: parseInt(results[0].rows[0].total, 10) || 0,
      processing: parseInt(results[1].rows[0].total, 10) || 0,
      completed: parseInt(results[2].rows[0].total, 10) || 0,
      failed: parseInt(results[3].rows[0].total, 10) || 0,
      today: parseInt(results[4].rows[0].total, 10) || 0
    };
  }

  async findById(id: string): Promise<AiJob> {
    const { rows } = await db.query(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id]);
    
    if (rows.length === 0) throw new NotFoundError('AI Job not found');
    return rows[0] as AiJob;
  }

  async create(dto: CreateAiJobDTO): Promise<AiJob> {
    const query = `
      INSERT INTO ${this.tableName} (job_name, content_type, action_type, total_items, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const params = [
      dto.job_name,
      dto.content_type,
      dto.action_type,
      dto.total_items || 1,
      'PENDING'
    ];
    
    const { rows } = await db.query(query, params);
    return rows[0] as AiJob;
  }

  async updateStatus(id: string, status: string, errorMessage?: string): Promise<AiJob> {
    let updateClause = `status = $1`;
    const params: any[] = [status];
    let paramIndex = 2;

    if (errorMessage !== undefined) {
      updateClause += `, error_message = $${paramIndex}`;
      params.push(errorMessage);
      paramIndex++;
    }
    
    if (status === 'PROCESSING') {
      updateClause += `, started_at = NOW()`;
    }
    
    if (status === 'COMPLETED' || status === 'FAILED') {
      updateClause += `, completed_at = NOW()`;
    }

    params.push(id);
    
    const query = `
      UPDATE ${this.tableName} 
      SET ${updateClause}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const { rows } = await db.query(query, params);
    if (rows.length === 0) throw new NotFoundError('AI Job not found');
    return rows[0] as AiJob;
  }
  
  async delete(id: string): Promise<void> {
    await db.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
  }
}
