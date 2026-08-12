import { TranslationProvider } from './TranslationProvider';
import { LibreTranslateProvider } from './LibreTranslateProvider';
import { GoogleTranslateProvider } from './GoogleTranslateProvider';
import { translationRepository } from './TranslationRepository';
import { CreateTranslationDTO } from './TranslationDTO';
import { ContentType } from './TranslationTypes';
import { db } from '@common/database/DatabaseClient';
import { AppError } from '@/errors/appError';
import { logger } from '@utils/logger';

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

  async generateTranslation(contentType: ContentType, contentId: string, sourceLang: string, targetLang: string) {
    if (sourceLang === targetLang) {
      throw new AppError('Source and target languages must be different.', 400);
    }

    let sourceContent: any;
    try {
      if (contentType === 'ARTICLE') {
        const res = await db.query(
          `SELECT title, excerpt, content, seo_title, seo_description FROM articles WHERE id = $1`,
          [contentId]
        );
        sourceContent = res.rows[0];
      } else if (contentType === 'PURAN') {
        const res = await db.query(`SELECT title, description, seo_title, seo_description FROM puranas WHERE id = $1`, [
          contentId
        ]);
        sourceContent = res.rows[0];
      } else if (contentType === 'FESTIVAL') {
        const res = await db.query(
          `SELECT name as title, description, seo_title, seo_description FROM festivals WHERE id = $1`,
          [contentId]
        );
        sourceContent = res.rows[0];
      }
    } catch (e) {
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
      sourceVersion: 1 // Default, could be queried from source row if tracked
    };

    // First save the state as GENERATING
    await translationRepository.upsertTranslation(dto);

    let lastProvider = 'none';

    try {
      // Helper to translate safely
      const safeTrans = async (text: string | null | undefined, format: 'text' | 'html' = 'text') => {
        if (!text) return null;
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
      } else if (contentType === 'PURAN') {
        dto.title = (await safeTrans(sourceContent.title)) || undefined;
        dto.description = (await safeTrans(sourceContent.description, 'html')) || undefined;
        dto.seoTitle = (await safeTrans(sourceContent.seo_title)) || undefined;
        dto.seoDescription = (await safeTrans(sourceContent.seo_description)) || undefined;
      } else if (contentType === 'FESTIVAL') {
        dto.title = (await safeTrans(sourceContent.title)) || undefined;
        dto.description = (await safeTrans(sourceContent.description)) || undefined;
        // Wait, festivals table doesn't have 'festival_details', only 'description'.
        // Assuming 'description' holds the rich text details as per schema check.
        dto.seoTitle = (await safeTrans(sourceContent.seo_title)) || undefined;
        dto.seoDescription = (await safeTrans(sourceContent.seo_description)) || undefined;
      }

      dto.provider = lastProvider;
      dto.translationStatus = 'NEEDS_REVIEW';

      return await translationRepository.upsertTranslation(dto);
    } catch (error: any) {
      logger.error('Translation Generation Failed', error);
      dto.translationStatus = 'FAILED';
      await translationRepository.upsertTranslation(dto);
      throw new AppError('Translation failed. Review logs for details.', 500);
    }
  }

  async generateLiveTranslation(content: Record<string, any>, sourceLang: string, targetLang: string) {
    if (sourceLang === targetLang) {
      throw new AppError('Source and target languages must be different.', 400);
    }

    let lastProvider = 'none';
    const translatedContent: Record<string, any> = {};

    const safeTrans = async (text: string | null | undefined, format: 'text' | 'html' = 'text') => {
      if (!text) return null;
      const res = await this.executeWithFallback(text, sourceLang, targetLang, format);
      lastProvider = res.provider;
      return res.translated;
    };

    try {
      for (const [key, value] of Object.entries(content)) {
        if (!value) continue;
        const format = key === 'content' || key === 'description' ? 'html' : 'text';
        translatedContent[key] = (await safeTrans(value, format)) || undefined;
      }
      return { translations: translatedContent, provider: lastProvider };
    } catch (error: any) {
      logger.error('Live Translation Generation Failed', error);
      throw new AppError('Live Translation failed. Review logs for details.', 500);
    }
  }

  private async executeWithFallback(
    text: string,
    sourceLang: string,
    targetLang: string,
    format: 'text' | 'html'
  ): Promise<{ translated: string; provider: string }> {
    if (!text || text.trim() === '') {
      return { translated: '', provider: 'none' };
    }

    const providerSelection = process.env.TRANSLATION_PROVIDER || 'google';

    let primaryProvider = this.googleProvider;
    let secondaryProvider = this.libreProvider;

    if (providerSelection === 'libretranslate') {
      primaryProvider = this.libreProvider;
      secondaryProvider = this.googleProvider;
    }

    try {
      const translated = await primaryProvider.translate(text, sourceLang, targetLang, format);
      return { translated, provider: primaryProvider.name };
    } catch (error: any) {
      logger.warn(
        `Primary translation provider (${primaryProvider.name}) failed: ${error.message}. Attempting fallback...`
      );

      try {
        const translated = await secondaryProvider.translate(text, sourceLang, targetLang, format);
        return { translated, provider: secondaryProvider.name };
      } catch (fallbackError: any) {
        logger.error(`Fallback translation provider (${secondaryProvider.name}) also failed: ${fallbackError.message}`);
        throw new AppError('All translation providers failed.', 502);
      }
    }
  }
}

export const translationService = new TranslationService();
