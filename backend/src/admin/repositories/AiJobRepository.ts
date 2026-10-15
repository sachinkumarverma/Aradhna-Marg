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
      if (status.includes(',')) {
        const statuses = status
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const placeholders = statuses.map((_, i) => `$${i + 1}`).join(', ');
        whereClause = `WHERE status IN (${placeholders})`;
        params.push(...statuses);
      } else {
        params.push(status);
        whereClause = `WHERE status = $1`;
      }
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

    const query = `
      SELECT
        (SELECT COUNT(*) FROM ${this.tableName} WHERE status = 'PENDING') as pending,
        (SELECT COUNT(*) FROM ${this.tableName} WHERE status = 'PROCESSING') as processing,
        (SELECT COUNT(*) FROM ${this.tableName} WHERE status = 'COMPLETED') as completed,
        (SELECT COUNT(*) FROM ${this.tableName} WHERE status = 'FAILED') as failed,
        (SELECT COUNT(*) FROM ${this.tableName} WHERE created_at >= $1) as today
    `;

    const { rows } = await db.query(query, [todayStr]);
    const row = rows[0] || {};

    return {
      pending: parseInt(row.pending || '0', 10),
      processing: parseInt(row.processing || '0', 10),
      completed: parseInt(row.completed || '0', 10),
      failed: parseInt(row.failed || '0', 10),
      today: parseInt(row.today || '0', 10)
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

  async getBulkCounts(): Promise<{
    bulkSeo: number;
    bulkExcerpt: number;
    bulkFestival: number;
    bulkBhajanMeaning: number;
  }> {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM bhajans WHERE (seo_description IS NULL OR trim(seo_description) = '') AND deleted_at IS NULL) as bhajan_seo,
        (SELECT COUNT(*) FROM articles WHERE (seo_description IS NULL OR trim(seo_description) = '') AND deleted_at IS NULL) as article_seo,
        (SELECT COUNT(*) FROM articles WHERE (excerpt IS NULL OR trim(excerpt) = '') AND content IS NOT NULL AND deleted_at IS NULL) as article_excerpt,
        (SELECT COUNT(*) FROM festivals WHERE short_description IS NULL OR trim(short_description) = '') as festival_desc,
        (SELECT COUNT(*) FROM bhajans WHERE (short_description IS NULL OR trim(short_description) = '') AND deleted_at IS NULL) as bhajan_meaning
    `;
    const { rows } = await db.query(query);
    const row = rows[0] || {};

    const bulkSeo = parseInt(row.bhajan_seo || '0', 10) + parseInt(row.article_seo || '0', 10);
    const bulkExcerpt = parseInt(row.article_excerpt || '0', 10);
    const bulkFestival = parseInt(row.festival_desc || '0', 10);
    const bulkBhajanMeaning = parseInt(row.bhajan_meaning || '0', 10);

    return { bulkSeo, bulkExcerpt, bulkFestival, bulkBhajanMeaning };
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
