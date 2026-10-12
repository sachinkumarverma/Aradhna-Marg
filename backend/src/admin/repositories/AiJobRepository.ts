import { db } from '@common/database/DatabaseClient';
import { AiJob, CreateAiJobDTO } from '@models/AiJob';
import { NotFoundError, AppError } from '@/errors/appError';

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
    today.setHours(0, 0, 0, 0);
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
      INSERT INTO ${this.tableName} (job_name, content_type, action_type, total_items, status, content_id, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const params = [
      dto.job_name,
      dto.content_type,
      dto.action_type,
      dto.total_items || 1,
      'PENDING',
      dto.content_id || null,
      JSON.stringify(dto.metadata || {})
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

  async resetForRetry(id: string): Promise<AiJob> {
    const existing = await this.findById(id);
    if (existing.status !== 'FAILED') {
      throw new AppError(`Cannot retry AI Job with status '${existing.status}'. Only FAILED jobs can be retried.`, 400);
    }

    const query = `
      UPDATE ${this.tableName}
      SET status = 'PENDING',
          error_message = NULL,
          started_at = NULL,
          completed_at = NULL,
          processed_items = 0,
          progress = 0,
          updated_at = NOW()
      WHERE id = $1 AND status = 'FAILED'
      RETURNING *
    `;
    const { rows } = await db.query(query, [id]);
    if (rows.length === 0) throw new AppError('AI Job could not be retried because it is not in FAILED status', 400);
    return rows[0] as AiJob;
  }

  async getBulkCounts(): Promise<{ bulkSeo: number; bulkExcerpt: number; bulkFestival: number }> {
    const [bhajanSeo, articleSeo, festivalSeo, puranSeo, articleExcerpt, festivalDesc] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM bhajans WHERE seo_description IS NULL OR trim(seo_description) = ''`),
      db.query(`SELECT COUNT(*) FROM articles WHERE seo_description IS NULL OR trim(seo_description) = ''`),
      db.query(`SELECT COUNT(*) FROM festivals WHERE seo_description IS NULL OR trim(seo_description) = ''`),
      db.query(`SELECT COUNT(*) FROM puranas WHERE seo_description IS NULL OR trim(seo_description) = ''`),
      db.query(`SELECT COUNT(*) FROM articles WHERE (excerpt IS NULL OR trim(excerpt) = '') AND content IS NOT NULL`),
      db.query(`SELECT COUNT(*) FROM festivals WHERE short_description IS NULL OR trim(short_description) = ''`)
    ]);

    const bulkSeo =
      parseInt(bhajanSeo.rows[0].count, 10) +
      parseInt(articleSeo.rows[0].count, 10) +
      parseInt(festivalSeo.rows[0].count, 10) +
      parseInt(puranSeo.rows[0].count, 10);
    const bulkExcerpt = parseInt(articleExcerpt.rows[0].count, 10);
    const bulkFestival = parseInt(festivalDesc.rows[0].count, 10);

    return { bulkSeo, bulkExcerpt, bulkFestival };
  }

  async delete(id: string): Promise<void> {
    await db.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
  }

  async claimNextPendingJob(): Promise<AiJob | null> {
    const query = `
      UPDATE ${this.tableName}
      SET status = 'PROCESSING', started_at = NOW(), updated_at = NOW()
      WHERE id = (
        SELECT id FROM ${this.tableName}
        WHERE status = 'PENDING'
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *
    `;
    const { rows } = await db.query(query);
    return rows.length > 0 ? (rows[0] as AiJob) : null;
  }

  async completeJob(id: string): Promise<void> {
    await db.query(
      `UPDATE ${this.tableName} SET status = 'COMPLETED', progress = 100, completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  async failJob(id: string, errorMessage: string): Promise<void> {
    await db.query(
      `UPDATE ${this.tableName} SET status = 'FAILED', error_message = $1, completed_at = NOW(), updated_at = NOW() WHERE id = $2`,
      [errorMessage || 'Unknown processing error', id]
    );
  }

  async updateProgress(id: string, processedItems: number, progress: number, totalItems?: number): Promise<void> {
    if (totalItems !== undefined) {
      await db.query(
        `UPDATE ${this.tableName} SET total_items = $1, processed_items = $2, progress = $3, updated_at = NOW() WHERE id = $4`,
        [totalItems, processedItems, progress, id]
      );
    } else {
      await db.query(
        `UPDATE ${this.tableName} SET processed_items = $1, progress = $2, updated_at = NOW() WHERE id = $3`,
        [processedItems, progress, id]
      );
    }
  }

  async recoverStuckJobs(olderThanMinutes: number = 15): Promise<number> {
    const query = `
      UPDATE ${this.tableName}
      SET status = 'PENDING',
          started_at = NULL,
          error_message = 'Automatically recovered from stuck PROCESSING state upon worker startup',
          updated_at = NOW()
      WHERE status = 'PROCESSING'
        AND (
          started_at < NOW() - ($1 || ' minutes')::interval
          OR (started_at IS NULL AND updated_at < NOW() - ($1 || ' minutes')::interval)
        )
      RETURNING id
    `;
    const { rows } = await db.query(query, [olderThanMinutes]);
    return rows.length;
  }
}

export const aiJobRepository = new AiJobRepository();
