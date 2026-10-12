import { logger } from '@utils/logger';
import { getAiProvider } from './AiProvider';
import { AiPrompts } from './AiPrompts';
import { aiJobRepository } from '@admin/repositories/AiJobRepository';
import { bhajanRepository } from '@features/bhajans/BhajanRepository';
import { articleRepository } from '@repositories/ArticleRepository';
import { festivalRepository } from '@repositories/FestivalRepository';
import { puranRepository } from '@repositories/PuranRepository';
import { categoryRepository } from '@features/categories/CategoryRepository';
import { ContentSafetyValidator } from '@/agents/utils/ContentSafetyValidator';

export class AiWorker {
  private isProcessing = false;
  private intervalTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.recoverStuckJobs().catch((err) => {
      logger.error({ error: err.message }, 'Error in AiWorker startup stuck job recovery');
    });
    this.startPeriodicCheck();
  }

  /**
   * Resets any jobs stuck in PROCESSING for more than 15 minutes back to PENDING.
   * Safe, deterministic, and idempotent.
   */
  public async recoverStuckJobs(olderThanMinutes = 15): Promise<number> {
    try {
      const recoveredCount = await aiJobRepository.recoverStuckJobs(olderThanMinutes);
      if (recoveredCount > 0) {
        logger.info({ recoveredCount, olderThanMinutes }, 'Recovered stuck PROCESSING AI jobs on worker startup');
      }
      return recoveredCount;
    } catch (err: any) {
      logger.error({ error: err.message }, 'Failed to recover stuck PROCESSING AI jobs on startup');
      return 0;
    }
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
        const job = await aiJobRepository.claimNextPendingJob();
        if (!job) break;

        await this.executeJob(job);
      }
    } catch (error: any) {
      logger.error({ error: error.message }, 'AiWorker execution error');
    } finally {
      this.isProcessing = false;
    }
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

      await aiJobRepository.completeJob(job.id);
      logger.info({ jobId: job.id }, 'AI Job completed successfully');
    } catch (error: any) {
      logger.error({ jobId: job.id, error: error.message }, 'AI Job failed');
      await aiJobRepository.failJob(job.id, error.message || 'Unknown processing error');
    }
  }

  /**
   * Generates devotional meaning for Bhajans.
   */
  private async processBhajanMeaning(job: any, provider: any): Promise<void> {
    const bhajan = await bhajanRepository.findForAiMeaning(job.content_id);
    if (!bhajan) throw new Error('No bhajan record found to process.');

    const promptPayload = AiPrompts.bhajanMeaning(bhajan);
    const meaning = await provider.generateCompletion(promptPayload);

    await bhajanRepository.updateAiMeaning(bhajan.id, meaning);
    await aiJobRepository.updateProgress(job.id, 1, 100);
  }

  /**
   * Generates summary / excerpt for Articles.
   */
  private async processArticleSummary(job: any, provider: any): Promise<void> {
    const article = await articleRepository.findForAiSummary(job.content_id);
    if (!article || !article.content) throw new Error('No article with content found to process.');

    const promptPayload = AiPrompts.articleSummary(article);
    const summary = await provider.generateCompletion(promptPayload);

    await articleRepository.updateExcerpt(article.id, summary);
    await aiJobRepository.updateProgress(job.id, 1, 100);
  }

  /**
   * Improves grammar of Article content.
   */
  private async processArticleGrammar(job: any, provider: any): Promise<void> {
    const article = await articleRepository.findForAiGrammar(job.content_id);
    if (!article || !article.content) throw new Error('No article content found for grammar improvement.');

    const promptPayload = AiPrompts.articleGrammar(article);
    const polishedContent = await provider.generateCompletion(promptPayload);

    // Validate that long-form content was not condensed or stripped
    const validation = ContentSafetyValidator.validateContentImprovement({
      entityType: 'article',
      targetField: 'content',
      originalContent: article.content,
      proposedContent: polishedContent
    });

    if (!validation.isValid) {
      throw new Error(`Article grammar improvement safety rejected: ${validation.reason}`);
    }

    await articleRepository.updateContent(article.id, polishedContent);
    await aiJobRepository.updateProgress(job.id, 1, 100);
  }

  /**
   * Generates SEO metadata for any content type without overwriting manual fields.
   */
  private async processContentSeo(job: any, provider: any): Promise<void> {
    const contentType = (job.content_type || '').toLowerCase();
    let item: any;
    let updater: (id: string, title: string, desc: string) => Promise<void>;

    if (contentType.includes('bhajan')) {
      item = await bhajanRepository.findForSeo(job.content_id);
      updater = (id, title, desc) => bhajanRepository.updateSeo(id, title, desc);
    } else if (contentType.includes('festival')) {
      item = await festivalRepository.findForSeo(job.content_id);
      updater = (id, title, desc) => festivalRepository.updateSeo(id, title, desc);
    } else if (contentType.includes('category')) {
      item = await categoryRepository.findForSeo(job.content_id);
      updater = (id, title, desc) => categoryRepository.updateSeo(id, title, desc);
    } else if (contentType.includes('puran')) {
      item = await puranRepository.findForSeo(job.content_id);
      updater = (id, title, desc) => puranRepository.updateSeo(id, title, desc);
    } else {
      // Default to articles
      item = await articleRepository.findForSeo(job.content_id);
      updater = (id, title, desc) => articleRepository.updateSeo(id, title, desc);
    }

    if (!item) throw new Error(`No ${contentType || 'content'} record found for SEO generation.`);

    const promptPayload = AiPrompts.seoMetadata(contentType || 'Content', item);
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

    await updater(item.id, newTitle, newDesc);
    await aiJobRepository.updateProgress(job.id, 1, 100);
  }

  /**
   * Improves/Generates festival description.
   */
  private async processFestivalDescription(job: any, provider: any): Promise<void> {
    const festival = await festivalRepository.findForAiDescription(job.content_id);
    if (!festival) throw new Error('No festival record found to process.');

    const promptPayload = AiPrompts.festivalDescription(festival);
    const desc = await provider.generateCompletion(promptPayload);

    await festivalRepository.updateAiDescription(festival.id, desc);
    await aiJobRepository.updateProgress(job.id, 1, 100);
  }

  /**
   * Generates Purana short description.
   */
  private async processPuranDescription(job: any, provider: any): Promise<void> {
    const puran = await puranRepository.findForAiDescription(job.content_id);
    if (!puran) throw new Error('No puran record found to process.');

    const promptPayload = AiPrompts.puranShortDescription(puran);
    const shortDesc = await provider.generateCompletion(promptPayload);

    await puranRepository.updateAiDescription(puran.id, shortDesc);
    await aiJobRepository.updateProgress(job.id, 1, 100);
  }

  /**
   * Bulk SEO generation: generates missing SEO fields for Bhajans & Articles without overwriting.
   */
  private async processBulkSeo(job: any, provider: any): Promise<void> {
    const [bhajans, articles] = await Promise.all([
      bhajanRepository.findMissingSeo(50),
      articleRepository.findMissingSeo(50)
    ]);

    const total = bhajans.length + articles.length;
    let processed = 0;

    await aiJobRepository.updateProgress(job.id, 0, 0, total);

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
        await bhajanRepository.updateSeo(b.id, updatedTitle, updatedDesc);
      } catch (err: any) {
        logger.warn({ id: b.id, err: err.message }, 'Failed single bhajan bulk SEO item');
      }
      processed++;
      const progress = total > 0 ? Math.round((processed / total) * 100) : 100;
      await aiJobRepository.updateProgress(job.id, processed, progress);
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
        await articleRepository.updateSeo(a.id, updatedTitle, updatedDesc);
      } catch (err: any) {
        logger.warn({ id: a.id, err: err.message }, 'Failed single article bulk SEO item');
      }
      processed++;
      const progress = total > 0 ? Math.round((processed / total) * 100) : 100;
      await aiJobRepository.updateProgress(job.id, processed, progress);
    }
  }

  /**
   * Bulk Article Excerpts generation for articles missing an excerpt.
   */
  private async processBulkExcerpt(job: any, provider: any): Promise<void> {
    const articles = await articleRepository.findMissingExcerpts(50);
    const total = articles.length;
    let processed = 0;

    await aiJobRepository.updateProgress(job.id, 0, 0, total);

    for (const a of articles) {
      try {
        const promptPayload = AiPrompts.articleSummary(a);
        const excerpt = await provider.generateCompletion(promptPayload);
        await articleRepository.updateExcerpt(a.id, excerpt);
      } catch (err: any) {
        logger.warn({ id: a.id, err: err.message }, 'Failed single article excerpt');
      }
      processed++;
      const progress = total > 0 ? Math.round((processed / total) * 100) : 100;
      await aiJobRepository.updateProgress(job.id, processed, progress);
    }
  }

  /**
   * Bulk Festival Summaries generation for festivals missing short_description.
   */
  private async processBulkFestival(job: any, provider: any): Promise<void> {
    const festivals = await festivalRepository.findMissingDescriptions(50);
    const total = festivals.length;
    let processed = 0;

    await aiJobRepository.updateProgress(job.id, 0, 0, total);

    for (const f of festivals) {
      try {
        const promptPayload = AiPrompts.festivalDescription(f);
        const desc = await provider.generateCompletion(promptPayload);
        await festivalRepository.updateAiDescription(f.id, desc);
      } catch (err: any) {
        logger.warn({ id: f.id, err: err.message }, 'Failed single festival description');
      }
      processed++;
      const progress = total > 0 ? Math.round((processed / total) * 100) : 100;
      await aiJobRepository.updateProgress(job.id, processed, progress);
    }
  }
}

export const aiWorker = new AiWorker();
