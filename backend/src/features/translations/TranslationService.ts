import { TranslationProvider } from './TranslationProvider';
import { LibreTranslateProvider } from './LibreTranslateProvider';
import { GoogleTranslateProvider } from './GoogleTranslateProvider';
import { translationRepository } from './TranslationRepository';
import { CreateTranslationDTO } from './TranslationDTO';
import { ContentType } from './TranslationTypes';
import { db } from '@common/database/DatabaseClient';
import { AppError } from '@/errors/appError';
import { logger } from '@utils/logger';
import { translationCacheService } from './TranslationCacheService';
import { translationQuotaService } from './TranslationQuotaService';
import { config } from '@/config';

export class TranslationService {
  private libreProvider: TranslationProvider;
  private googleProvider: TranslationProvider;

  constructor() {
    this.libreProvider = new LibreTranslateProvider();
    this.googleProvider = new GoogleTranslateProvider();
  }

  async translateHtml(
    html: string,
    sourceLang: string,
    targetLang: string
  ): Promise<{ translated: string; provider: string }> {
    return this.executeWithFallback(html, sourceLang, targetLang, 'html');
  }

  async translateText(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<{ translated: string; provider: string }> {
    return this.executeWithFallback(text, sourceLang, targetLang, 'text');
  }

  /**
   * Translates content for an existing entity and persists the result both
   * in content_translations AND in the entity's database table (title_en, content_en, description_en, etc.)
   */
  async generateTranslation(contentType: ContentType, contentId: string, sourceLang: string, targetLang: string) {
    if (sourceLang === targetLang) {
      throw new AppError('Source and target languages must be different.', 400);
    }

    let sourceContent: any;
    try {
      if (contentType === 'ARTICLE') {
        const res = await db.query(
          `SELECT title, excerpt, content, seo_title, seo_description FROM articles WHERE id = $1 AND deleted_at IS NULL`,
          [contentId]
        );
        sourceContent = res.rows[0];
      } else if (contentType === 'PURAN') {
        const res = await db.query(
          `SELECT title, short_description, seo_title, seo_description FROM puranas WHERE id = $1 AND deleted_at IS NULL`,
          [contentId]
        );
        sourceContent = res.rows[0];
      } else if (contentType === 'FESTIVAL') {
        const res = await db.query(
          `SELECT name as title, short_description, content, seo_title, seo_description FROM festivals WHERE id = $1`,
          [contentId]
        );
        sourceContent = res.rows[0];
      } else if (contentType === 'BHAJAN') {
        const res = await db.query(
          `SELECT title, short_description, description, lyrics, lyrics_english, seo_title, seo_description FROM bhajans WHERE id = $1 AND deleted_at IS NULL`,
          [contentId]
        );
        sourceContent = res.rows[0];
      }
    } catch (e: any) {
      logger.error({ err: e?.message, contentType, contentId }, 'Failed to fetch source content');
      throw new AppError(`Failed to fetch source content for ${contentType}`, 500);
    }

    if (!sourceContent) {
      throw new AppError(`${contentType} not found`, 404);
    }

    // Prepare translation DTO
    const dto: CreateTranslationDTO = {
      contentType,
      contentId,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      translationStatus: 'GENERATING',
      sourceVersion: 1
    };

    // First save the state as GENERATING
    await translationRepository.upsertTranslation(dto);

    let lastProvider = 'none';

    try {
      // Helper to translate safely
      const safeTrans = async (text: string | null | undefined, format: 'text' | 'html' = 'text') => {
        if (!text || text.trim() === '') return null;
        const res = await this.executeWithFallback(text, sourceLang, targetLang, format);
        lastProvider = res.provider;
        return res.translated;
      };

      if (contentType === 'ARTICLE') {
        dto.title = (await safeTrans(sourceContent.title)) || undefined;
        dto.excerpt = (await safeTrans(sourceContent.excerpt)) || undefined;
        dto.content = (await safeTrans(sourceContent.content, 'html')) || undefined;
        dto.seoTitle = (await safeTrans(sourceContent.seo_title)) || undefined;
        dto.seoDescription = (await safeTrans(sourceContent.seo_description)) || undefined;

        // Save directly to articles table columns (title_en, excerpt_en, content_en, seo_title_en, seo_description_en)
        await db.query(
          `UPDATE articles SET
            title_en = COALESCE($1, title_en),
            excerpt_en = COALESCE($2, excerpt_en),
            content_en = COALESCE($3, content_en),
            seo_title_en = COALESCE($4, seo_title_en),
            seo_description_en = COALESCE($5, seo_description_en),
            updated_at = NOW()
          WHERE id = $6`,
          [dto.title, dto.excerpt, dto.content, dto.seoTitle, dto.seoDescription, contentId]
        );
      } else if (contentType === 'PURAN') {
        dto.title = (await safeTrans(sourceContent.title)) || undefined;
        dto.description = (await safeTrans(sourceContent.short_description, 'html')) || undefined;
        dto.seoTitle = (await safeTrans(sourceContent.seo_title)) || undefined;
        dto.seoDescription = (await safeTrans(sourceContent.seo_description)) || undefined;

        // Save directly to puranas table columns (title_en, description_en, seo_title_en, seo_description_en)
        await db.query(
          `UPDATE puranas SET
            title_en = COALESCE($1, title_en),
            description_en = COALESCE($2, description_en),
            seo_title_en = COALESCE($3, seo_title_en),
            seo_description_en = COALESCE($4, seo_description_en),
            updated_at = NOW()
          WHERE id = $5`,
          [dto.title, dto.description, dto.seoTitle, dto.seoDescription, contentId]
        );
      } else if (contentType === 'FESTIVAL') {
        dto.title = (await safeTrans(sourceContent.title)) || undefined;
        dto.excerpt = (await safeTrans(sourceContent.short_description)) || undefined;
        dto.content = (await safeTrans(sourceContent.content, 'html')) || undefined;
        dto.seoTitle = (await safeTrans(sourceContent.seo_title)) || undefined;
        dto.seoDescription = (await safeTrans(sourceContent.seo_description)) || undefined;

        // Save directly to festivals table columns (name_en, short_description_en, content_en, seo_title_en, seo_description_en)
        await db.query(
          `UPDATE festivals SET
            name_en = COALESCE($1, name_en),
            short_description_en = COALESCE($2, short_description_en),
            content_en = COALESCE($3, content_en),
            seo_title_en = COALESCE($4, seo_title_en),
            seo_description_en = COALESCE($5, seo_description_en),
            updated_at = NOW()
          WHERE id = $6`,
          [dto.title, dto.excerpt, dto.content, dto.seoTitle, dto.seoDescription, contentId]
        );
      } else if (contentType === 'BHAJAN') {
        dto.title = (await safeTrans(sourceContent.title)) || undefined;
        dto.excerpt = (await safeTrans(sourceContent.short_description)) || undefined;
        dto.description = (await safeTrans(sourceContent.description)) || undefined;
        dto.seoTitle = (await safeTrans(sourceContent.seo_title)) || undefined;
        dto.seoDescription = (await safeTrans(sourceContent.seo_description)) || undefined;

        // Save directly to bhajans table columns (title_en, english_title, short_description_en, description_en)
        await db.query(
          `UPDATE bhajans SET
            title_en = COALESCE($1, title_en),
            english_title = COALESCE($1, english_title),
            short_description_en = COALESCE($2, short_description_en),
            description_en = COALESCE($3, description_en),
            updated_at = NOW()
          WHERE id = $4`,
          [dto.title, dto.excerpt, dto.description, contentId]
        );
      }

      dto.provider = lastProvider;
      dto.translationStatus = 'NEEDS_REVIEW';

      return await translationRepository.upsertTranslation(dto);
    } catch (error: any) {
      logger.error({ err: error?.message, contentType, contentId }, 'Translation Generation Failed');
      dto.translationStatus = 'FAILED';
      await translationRepository.upsertTranslation(dto);
      // Preserve original Hindi content and return graceful error to admin
      throw new AppError(
        `Translation generation failed: ${error.message || 'Service unavailable'}. Original Hindi content was preserved.`,
        error.statusCode || 502
      );
    }
  }

  /**
   * Translates incoming content in real time for admin forms (Article, Festival, Purana, Bhajan).
   * If translation fails, returns a graceful error while guaranteeing original Hindi content remains preserved.
   */
  async generateLiveTranslation(content: Record<string, any>, sourceLang: string, targetLang: string) {
    if (sourceLang === targetLang) {
      throw new AppError('Source and target languages must be different.', 400);
    }

    if (!content || typeof content !== 'object' || Object.keys(content).length === 0) {
      return { translations: {}, provider: 'none' };
    }

    let lastProvider = 'none';
    const translatedContent: Record<string, any> = {};

    const safeTrans = async (text: string | null | undefined, format: 'text' | 'html' = 'text') => {
      if (!text || text.trim() === '') return '';
      const res = await this.executeWithFallback(text, sourceLang, targetLang, format);
      lastProvider = res.provider;
      return res.translated;
    };

    try {
      for (const [key, value] of Object.entries(content)) {
        if (!value || typeof value !== 'string' || value.trim() === '') continue;
        const format = key === 'content' || key === 'description' ? 'html' : 'text';
        translatedContent[key] = await safeTrans(value, format);
      }
      return { translations: translatedContent, provider: lastProvider };
    } catch (error: any) {
      logger.error({ err: error?.message }, 'Live Translation Generation Failed');
      // Preserves original Hindi content and returns a graceful error to the admin
      throw new AppError(
        `Live translation failed: ${error.message || 'Service unavailable'}. Original Hindi content was preserved.`,
        error.statusCode || 502
      );
    }
  }

  /**
   * Helper for record create/update operations:
   * Translates missing English fields when auto-translate is requested or enabled,
   * while strictly preserving original Hindi content if translation fails.
   */
  async translateRecordOnAdminSave(contentType: ContentType, data: any): Promise<void> {
    const isAutoTranslateRequested =
      data.autoTranslate === true ||
      data.auto_translate === true ||
      config.AUTO_TRANSLATE_ON_SAVE === 'true' ||
      process.env.AUTO_TRANSLATE_ON_SAVE === 'true';

    if (!isAutoTranslateRequested) return;

    try {
      if (contentType === 'ARTICLE') {
        if (data.title && !data.title_en) {
          const res = await this.translateText(data.title, 'hi', 'en');
          if (res?.translated) data.title_en = res.translated;
        }
        if (data.excerpt && !data.excerpt_en) {
          const res = await this.translateText(data.excerpt, 'hi', 'en');
          if (res?.translated) data.excerpt_en = res.translated;
        }
        if (data.content && !data.content_en) {
          const res = await this.translateHtml(data.content, 'hi', 'en');
          if (res?.translated) data.content_en = res.translated;
        }
        if (data.seo_title && !data.seo_title_en) {
          const res = await this.translateText(data.seo_title, 'hi', 'en');
          if (res?.translated) data.seo_title_en = res.translated;
        }
        if (data.seo_description && !data.seo_description_en) {
          const res = await this.translateText(data.seo_description, 'hi', 'en');
          if (res?.translated) data.seo_description_en = res.translated;
        }
      } else if (contentType === 'PURAN') {
        if (data.title && !data.title_en) {
          const res = await this.translateText(data.title, 'hi', 'en');
          if (res?.translated) data.title_en = res.translated;
        }
        if (data.short_description && !data.description_en) {
          const res = await this.translateHtml(data.short_description, 'hi', 'en');
          if (res?.translated) data.description_en = res.translated;
        }
        if (data.seo_title && !data.seo_title_en) {
          const res = await this.translateText(data.seo_title, 'hi', 'en');
          if (res?.translated) data.seo_title_en = res.translated;
        }
        if (data.seo_description && !data.seo_description_en) {
          const res = await this.translateText(data.seo_description, 'hi', 'en');
          if (res?.translated) data.seo_description_en = res.translated;
        }
      } else if (contentType === 'FESTIVAL') {
        if (data.name && !data.name_en) {
          const res = await this.translateText(data.name, 'hi', 'en');
          if (res?.translated) data.name_en = res.translated;
        }
        if (data.short_description && !data.short_description_en) {
          const res = await this.translateText(data.short_description, 'hi', 'en');
          if (res?.translated) data.short_description_en = res.translated;
        }
        if (data.content && !data.content_en) {
          const res = await this.translateHtml(data.content, 'hi', 'en');
          if (res?.translated) data.content_en = res.translated;
        }
        if (data.seo_title && !data.seo_title_en) {
          const res = await this.translateText(data.seo_title, 'hi', 'en');
          if (res?.translated) data.seo_title_en = res.translated;
        }
        if (data.seo_description && !data.seo_description_en) {
          const res = await this.translateText(data.seo_description, 'hi', 'en');
          if (res?.translated) data.seo_description_en = res.translated;
        }
      } else if (contentType === 'BHAJAN') {
        if (data.title && (!data.title_en || !data.english_title)) {
          const res = await this.translateText(data.title, 'hi', 'en');
          if (res?.translated) {
            if (!data.title_en) data.title_en = res.translated;
            if (!data.english_title) data.english_title = res.translated;
          }
        }
        if (data.short_description && !data.short_description_en) {
          const res = await this.translateText(data.short_description, 'hi', 'en');
          if (res?.translated) data.short_description_en = res.translated;
        }
        if (data.description && !data.description_en) {
          const res = await this.translateText(data.description, 'hi', 'en');
          if (res?.translated) data.description_en = res.translated;
        }
        // Note: Sacred devotional lyrics are NEVER automatically translated to English,
        // preserving linguistic sanctity per constitutional policy.
      }
    } catch (err: any) {
      // Graceful error handling: Original Hindi content is strictly preserved
      logger.warn(
        { err: err?.message, contentType },
        '[TranslationService] Auto-translation on record save failed; preserving original Hindi content'
      );
    }
  }

  /**
   * Core translation execution pipeline with persistent caching,
   * quota enforcement, and fallback provider support.
   */
  private async executeWithFallback(
    text: string,
    sourceLang: string,
    targetLang: string,
    format: 'text' | 'html'
  ): Promise<{ translated: string; provider: string }> {
    if (!text || text.trim() === '') {
      return { translated: '', provider: 'none' };
    }

    // 1. Check Caching Layer: If unchanged content, never translate again
    const cached = await translationCacheService.get(text, sourceLang, targetLang, format);
    if (cached) {
      return cached;
    }

    // 2. Check Monthly Quota Limit before invoking API
    await translationQuotaService.checkQuota(text.length);

    // 3. Select Provider
    const providerSelection = config.TRANSLATION_PROVIDER || process.env.TRANSLATION_PROVIDER || 'google';

    let primaryProvider = this.googleProvider;
    let secondaryProvider = this.libreProvider;

    if (providerSelection === 'libretranslate') {
      primaryProvider = this.libreProvider;
      secondaryProvider = this.googleProvider;
    }

    let translated: string;
    let finalProviderName: string;

    try {
      translated = await primaryProvider.translate(text, sourceLang, targetLang, format);
      finalProviderName = primaryProvider.name;
    } catch (error: any) {
      logger.warn(
        `[TranslationService] Primary translation provider (${primaryProvider.name}) failed: ${error.message}. Attempting fallback...`
      );

      try {
        translated = await secondaryProvider.translate(text, sourceLang, targetLang, format);
        finalProviderName = secondaryProvider.name;
      } catch (fallbackError: any) {
        logger.error(
          `[TranslationService] Fallback translation provider (${secondaryProvider.name}) also failed: ${fallbackError.message}`
        );
        throw error; // Re-throw primary error with status codes preserved
      }
    }

    // 4. Save result to Persistent Cache
    await translationCacheService.set(text, translated, sourceLang, targetLang, format, finalProviderName);

    // 5. Record Quota Usage for the current month
    await translationQuotaService.recordUsage(text.length);

    return { translated, provider: finalProviderName };
  }
}

export const translationService = new TranslationService();
