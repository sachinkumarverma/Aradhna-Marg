import { db } from '@common/database/DatabaseClient';
import { logger } from '@utils/logger';
import { getAiProvider } from './AiProvider';
import { AiPrompts } from './AiPrompts';

export class AiWorker {
  private isProcessing = false;
  private intervalTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startPeriodicCheck();
  }

  public startPeriodicCheck(intervalMs = 20000): void {
    if (this.intervalTimer) return;
    this.intervalTimer = setInterval(() => {
      this.triggerWorker().catch((err) => {
        logger.error({ error: err.message }, 'Error in periodic AiWorker trigger');
      });
    }, intervalMs);
  }

  public stopPeriodicCheck(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  public async triggerWorker(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    try {
      while (true) {
        const job = await this.claimNextPendingJob();
        if (!job) break;

        await this.executeJob(job);
      }
    } catch (error: any) {
      logger.error({ error: error.message }, 'AiWorker execution error');
    } finally {
      this.isProcessing = false;
    }
  }

  private async claimNextPendingJob(): Promise<any | null> {
    const query = `
      UPDATE ai_jobs
      SET status = 'PROCESSING', started_at = NOW(), updated_at = NOW()
      WHERE id = (
        SELECT id FROM ai_jobs
        WHERE status = 'PENDING'
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *
    `;
    const { rows } = await db.query(query);
    return rows.length > 0 ? rows[0] : null;
  }

  private async executeJob(job: any): Promise<void> {
    const provider = getAiProvider();
    logger.info({ jobId: job.id, jobName: job.job_name, action: job.action_type }, 'Processing AI Job');

    try {
      switch (job.action_type) {
        case 'GENERATE_MEANING':
          await this.processBhajanMeaning(job, provider);
          break;

        case 'GENERATE_SUMMARY':
          await this.processArticleSummary(job, provider);
          break;

        case 'IMPROVE_GRAMMAR':
          await this.processArticleGrammar(job, provider);
          break;

        case 'GENERATE_SEO':
          await this.processContentSeo(job, provider);
          break;

        case 'IMPROVE_DESCRIPTION':
          await this.processFestivalDescription(job, provider);
          break;

        case 'GENERATE_SHORT_DESC':
          await this.processPuranDescription(job, provider);
          break;

        case 'BULK_SEO':
          await this.processBulkSeo(job, provider);
          break;

        case 'BULK_EXCERPT':
          await this.processBulkExcerpt(job, provider);
          break;

        case 'BULK_FESTIVAL':
          await this.processBulkFestival(job, provider);
          break;

        default:
          throw new Error(`Unsupported AI action type: ${job.action_type}`);
      }

      await db.query(
        `UPDATE ai_jobs SET status = 'COMPLETED', progress = 100, completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [job.id]
      );
      logger.info({ jobId: job.id }, 'AI Job completed successfully');
    } catch (error: any) {
      logger.error({ jobId: job.id, error: error.message }, 'AI Job failed');
      await db.query(
        `UPDATE ai_jobs SET status = 'FAILED', error_message = $1, completed_at = NOW(), updated_at = NOW() WHERE id = $2`,
        [error.message || 'Unknown processing error', job.id]
      );
    }
  }

  /**
   * Generates devotional meaning for Bhajans.
   */
  private async processBhajanMeaning(job: any, provider: any): Promise<void> {
    let bhajan: any;

    if (job.content_id) {
      const res = await db.query(
        `SELECT id, title, lyrics, description, short_description FROM bhajans WHERE id = $1`,
        [job.content_id]
      );
      bhajan = res.rows[0];
    } else {
      // Pick the first bhajan where short_description or description is empty
      const res = await db.query(
        `SELECT id, title, lyrics, description, short_description FROM bhajans 
         WHERE (short_description IS NULL OR trim(short_description) = '')
         ORDER BY created_at DESC LIMIT 1`
      );
      bhajan =
        res.rows[0] ||
        (
          await db.query(
            `SELECT id, title, lyrics, description, short_description FROM bhajans ORDER BY created_at DESC LIMIT 1`
          )
        ).rows[0];
    }

    if (!bhajan) throw new Error('No bhajan record found to process.');

    const promptPayload = AiPrompts.bhajanMeaning(bhajan);
    const meaning = await provider.generateCompletion(promptPayload);

    // Write meaning to short_description and description (if description is null/empty)
    await db.query(
      `UPDATE bhajans 
       SET short_description = $1, 
           description = COALESCE(NULLIF(description, ''), $1),
           ai_generated_flag = true,
           updated_at = NOW() 
       WHERE id = $2`,
      [meaning, bhajan.id]
    );

    await db.query(`UPDATE ai_jobs SET processed_items = 1, progress = 100 WHERE id = $1`, [job.id]);
  }

  /**
   * Generates summary / excerpt for Articles.
   */
  private async processArticleSummary(job: any, provider: any): Promise<void> {
    let article: any;

    if (job.content_id) {
      const res = await db.query(`SELECT id, title, content, excerpt FROM articles WHERE id = $1`, [job.content_id]);
      article = res.rows[0];
    } else {
      const res = await db.query(
        `SELECT id, title, content, excerpt FROM articles 
         WHERE (excerpt IS NULL OR trim(excerpt) = '') AND content IS NOT NULL
         ORDER BY created_at DESC LIMIT 1`
      );
      article =
        res.rows[0] ||
        (await db.query(`SELECT id, title, content, excerpt FROM articles ORDER BY created_at DESC LIMIT 1`)).rows[0];
    }

    if (!article || !article.content) throw new Error('No article with content found to process.');

    const promptPayload = AiPrompts.articleSummary(article);
    const summary = await provider.generateCompletion(promptPayload);

    await db.query(`UPDATE articles SET excerpt = $1, updated_at = NOW() WHERE id = $2`, [summary, article.id]);
    await db.query(`UPDATE ai_jobs SET processed_items = 1, progress = 100 WHERE id = $1`, [job.id]);
  }

  /**
   * Improves grammar of Article content.
   */
  private async processArticleGrammar(job: any, provider: any): Promise<void> {
    let article: any;

    if (job.content_id) {
      const res = await db.query(`SELECT id, title, content FROM articles WHERE id = $1`, [job.content_id]);
      article = res.rows[0];
    } else {
      const res = await db.query(
        `SELECT id, title, content FROM articles WHERE content IS NOT NULL ORDER BY created_at DESC LIMIT 1`
      );
      article = res.rows[0];
    }

    if (!article || !article.content) throw new Error('No article content found for grammar improvement.');

    const promptPayload = AiPrompts.articleGrammar(article);
    const polishedContent = await provider.generateCompletion(promptPayload);

    await db.query(`UPDATE articles SET content = $1, updated_at = NOW() WHERE id = $2`, [polishedContent, article.id]);
    await db.query(`UPDATE ai_jobs SET processed_items = 1, progress = 100 WHERE id = $1`, [job.id]);
  }

  /**
   * Generates SEO metadata for any content type without overwriting manual fields.
   */
  private async processContentSeo(job: any, provider: any): Promise<void> {
    const contentType = (job.content_type || '').toLowerCase();
    let table = 'articles';
    let queryField = 'content';

    if (contentType.includes('bhajan')) {
      table = 'bhajans';
      queryField = 'lyrics';
    } else if (contentType.includes('festival')) {
      table = 'festivals';
      queryField = 'content';
    } else if (contentType.includes('category')) {
      table = 'categories';
      queryField = 'description';
    } else if (contentType.includes('puran')) {
      table = 'puranas';
      queryField = 'short_description';
    }

    const { rows } = await db.query(
      `SELECT * FROM ${table} 
       WHERE (seo_title IS NULL OR trim(seo_title) = '' OR seo_description IS NULL OR trim(seo_description) = '')
       ORDER BY created_at DESC LIMIT 1`
    );

    const item = rows[0] || (await db.query(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 1`)).rows[0];
    if (!item) throw new Error(`No ${contentType} record found for SEO generation.`);

    const promptPayload = AiPrompts.seoMetadata(contentType, item);
    const completion = await provider.generateCompletion(promptPayload);

    let parsedSeo: { seo_title?: string; seo_description?: string };
    try {
      parsedSeo = JSON.parse(completion);
    } catch {
      // Fallback regex parsing
      const titleMatch = completion.match(/"seo_title"\s*:\s*"([^"]+)"/);
      const descMatch = completion.match(/"seo_description"\s*:\s*"([^"]+)"/);
      parsedSeo = {
        seo_title: titleMatch ? titleMatch[1] : undefined,
        seo_description: descMatch ? descMatch[1] : undefined
      };
    }

    const newTitle = item.seo_title || parsedSeo.seo_title || item.title || item.name;
    const newDesc = item.seo_description || parsedSeo.seo_description || '';

    await db.query(`UPDATE ${table} SET seo_title = $1, seo_description = $2, updated_at = NOW() WHERE id = $3`, [
      newTitle,
      newDesc,
      item.id
    ]);

    await db.query(`UPDATE ai_jobs SET processed_items = 1, progress = 100 WHERE id = $1`, [job.id]);
  }

  /**
   * Improves/Generates festival description.
   */
  private async processFestivalDescription(job: any, provider: any): Promise<void> {
    const { rows } = await db.query(
      `SELECT id, name, content, short_description FROM festivals 
       WHERE short_description IS NULL OR trim(short_description) = ''
       ORDER BY created_at DESC LIMIT 1`
    );

    const festival =
      rows[0] ||
      (await db.query(`SELECT id, name, content, short_description FROM festivals ORDER BY created_at DESC LIMIT 1`))
        .rows[0];
    if (!festival) throw new Error('No festival record found to process.');

    const promptPayload = AiPrompts.festivalDescription(festival);
    const desc = await provider.generateCompletion(promptPayload);

    await db.query(
      `UPDATE festivals 
       SET short_description = $1, 
           content = COALESCE(NULLIF(content, ''), $1),
           updated_at = NOW() 
       WHERE id = $2`,
      [desc, festival.id]
    );

    await db.query(`UPDATE ai_jobs SET processed_items = 1, progress = 100 WHERE id = $1`, [job.id]);
  }

  /**
   * Generates Purana short description.
   */
  private async processPuranDescription(job: any, provider: any): Promise<void> {
    const { rows } = await db.query(
      `SELECT id, title, author, short_description FROM puranas 
       WHERE short_description IS NULL OR trim(short_description) = ''
       ORDER BY created_at DESC LIMIT 1`
    );

    const puran =
      rows[0] ||
      (await db.query(`SELECT id, title, author, short_description FROM puranas ORDER BY created_at DESC LIMIT 1`))
        .rows[0];
    if (!puran) throw new Error('No puran record found to process.');

    const promptPayload = AiPrompts.puranShortDescription(puran);
    const shortDesc = await provider.generateCompletion(promptPayload);

    await db.query(`UPDATE puranas SET short_description = $1, updated_at = NOW() WHERE id = $2`, [
      shortDesc,
      puran.id
    ]);
    await db.query(`UPDATE ai_jobs SET processed_items = 1, progress = 100 WHERE id = $1`, [job.id]);
  }

  /**
   * Bulk SEO generation: generates missing SEO fields for Bhajans & Articles without overwriting.
   */
  private async processBulkSeo(job: any, provider: any): Promise<void> {
    // 1. Bhajans with missing SEO
    const { rows: bhajans } = await db.query(
      `SELECT id, title, lyrics, description, seo_title, seo_description FROM bhajans 
       WHERE (seo_title IS NULL OR trim(seo_title) = '' OR seo_description IS NULL OR trim(seo_description) = '')
       LIMIT 50`
    );

    // 2. Articles with missing SEO
    const { rows: articles } = await db.query(
      `SELECT id, title, excerpt, content, seo_title, seo_description FROM articles 
       WHERE (seo_title IS NULL OR trim(seo_title) = '' OR seo_description IS NULL OR trim(seo_description) = '')
       LIMIT 50`
    );

    const total = bhajans.length + articles.length;
    let processed = 0;

    await db.query(`UPDATE ai_jobs SET total_items = $1, processed_items = 0, progress = 0 WHERE id = $2`, [
      total,
      job.id
    ]);

    for (const b of bhajans) {
      try {
        const promptPayload = AiPrompts.seoMetadata('Bhajan', b);
        const completion = await provider.generateCompletion(promptPayload);
        let parsed: any = {};
        try {
          parsed = JSON.parse(completion);
        } catch {
          // ignore parse failure
        }
        const updatedTitle = b.seo_title || parsed.seo_title || b.title;
        const updatedDesc = b.seo_description || parsed.seo_description || '';
        await db.query(`UPDATE bhajans SET seo_title = $1, seo_description = $2, updated_at = NOW() WHERE id = $3`, [
          updatedTitle,
          updatedDesc,
          b.id
        ]);
      } catch (err: any) {
        logger.warn({ id: b.id, err: err.message }, 'Failed single bhajan bulk SEO item');
      }
      processed++;
      const progress = total > 0 ? Math.round((processed / total) * 100) : 100;
      await db.query(`UPDATE ai_jobs SET processed_items = $1, progress = $2 WHERE id = $3`, [
        processed,
        progress,
        job.id
      ]);
    }

    for (const a of articles) {
      try {
        const promptPayload = AiPrompts.seoMetadata('Article', a);
        const completion = await provider.generateCompletion(promptPayload);
        let parsed: any = {};
        try {
          parsed = JSON.parse(completion);
        } catch {
          // ignore
        }
        const updatedTitle = a.seo_title || parsed.seo_title || a.title;
        const updatedDesc = a.seo_description || parsed.seo_description || '';
        await db.query(`UPDATE articles SET seo_title = $1, seo_description = $2, updated_at = NOW() WHERE id = $3`, [
          updatedTitle,
          updatedDesc,
          a.id
        ]);
      } catch (err: any) {
        logger.warn({ id: a.id, err: err.message }, 'Failed single article bulk SEO item');
      }
      processed++;
      const progress = total > 0 ? Math.round((processed / total) * 100) : 100;
      await db.query(`UPDATE ai_jobs SET processed_items = $1, progress = $2 WHERE id = $3`, [
        processed,
        progress,
        job.id
      ]);
    }
  }

  /**
   * Bulk Article Excerpts generation for articles missing an excerpt.
   */
  private async processBulkExcerpt(job: any, provider: any): Promise<void> {
    const { rows: articles } = await db.query(
      `SELECT id, title, content, excerpt FROM articles 
       WHERE (excerpt IS NULL OR trim(excerpt) = '') AND content IS NOT NULL
       LIMIT 50`
    );

    const total = articles.length;
    let processed = 0;

    await db.query(`UPDATE ai_jobs SET total_items = $1, processed_items = 0, progress = 0 WHERE id = $2`, [
      total,
      job.id
    ]);

    for (const a of articles) {
      try {
        const promptPayload = AiPrompts.articleSummary(a);
        const excerpt = await provider.generateCompletion(promptPayload);
        await db.query(`UPDATE articles SET excerpt = $1, updated_at = NOW() WHERE id = $2`, [excerpt, a.id]);
      } catch (err: any) {
        logger.warn({ id: a.id, err: err.message }, 'Failed single article excerpt');
      }
      processed++;
      const progress = total > 0 ? Math.round((processed / total) * 100) : 100;
      await db.query(`UPDATE ai_jobs SET processed_items = $1, progress = $2 WHERE id = $3`, [
        processed,
        progress,
        job.id
      ]);
    }
  }

  /**
   * Bulk Festival Summaries generation for festivals missing short_description.
   */
  private async processBulkFestival(job: any, provider: any): Promise<void> {
    const { rows: festivals } = await db.query(
      `SELECT id, name, content, short_description FROM festivals 
       WHERE (short_description IS NULL OR trim(short_description) = '')
       LIMIT 50`
    );

    const total = festivals.length;
    let processed = 0;

    await db.query(`UPDATE ai_jobs SET total_items = $1, processed_items = 0, progress = 0 WHERE id = $2`, [
      total,
      job.id
    ]);

    for (const f of festivals) {
      try {
        const promptPayload = AiPrompts.festivalDescription(f);
        const desc = await provider.generateCompletion(promptPayload);
        await db.query(`UPDATE festivals SET short_description = $1, updated_at = NOW() WHERE id = $2`, [desc, f.id]);
      } catch (err: any) {
        logger.warn({ id: f.id, err: err.message }, 'Failed single festival description');
      }
      processed++;
      const progress = total > 0 ? Math.round((processed / total) * 100) : 100;
      await db.query(`UPDATE ai_jobs SET processed_items = $1, progress = $2 WHERE id = $3`, [
        processed,
        progress,
        job.id
      ]);
    }
  }
}

export const aiWorker = new AiWorker();
