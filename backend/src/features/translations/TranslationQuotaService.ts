import { db } from '@common/database/DatabaseClient';
import { config } from '@/config';
import { AppError } from '@/errors/appError';
import { logger } from '@utils/logger';
import { translationCacheService } from './TranslationCacheService';

export interface TranslationQuotaStats {
  month: string;
  charactersUsed: number;
  characterLimit: number;
  remainingCharacters: number;
  percentUsed: number;
  isLimitExceeded: boolean;
  totalTranslationsCount: number;
  totalCachedItems: number;
  isConfigured: boolean;
  provider: string;
}

export class TranslationQuotaService {
  private getCurrentMonthKey(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  getMonthlyLimit(): number {
    return Number(config.TRANSLATION_MONTHLY_CHAR_LIMIT) || 500000;
  }

  async getCurrentUsage(): Promise<{ charactersUsed: number; translationsCount: number }> {
    const month = this.getCurrentMonthKey();
    try {
      const res = await db.query(
        `SELECT characters_used, translations_count FROM translation_usage WHERE month = $1 LIMIT 1`,
        [month]
      );
      if (res.rows.length > 0) {
        return {
          charactersUsed: parseInt(res.rows[0].characters_used, 10) || 0,
          translationsCount: parseInt(res.rows[0].translations_count, 10) || 0
        };
      }
    } catch (err: any) {
      logger.warn({ err: err?.message }, '[TranslationQuotaService] Failed to fetch current month usage');
    }
    return { charactersUsed: 0, translationsCount: 0 };
  }

  async checkQuota(charactersToTranslate: number): Promise<void> {
    const limit = this.getMonthlyLimit();
    const { charactersUsed } = await this.getCurrentUsage();
    const projectedTotal = charactersUsed + charactersToTranslate;

    if (projectedTotal > limit) {
      const msg = `Monthly Google Cloud Translation quota exceeded: requested ${charactersToTranslate.toLocaleString()} chars would exceed limit of ${limit.toLocaleString()} chars (already used: ${charactersUsed.toLocaleString()} chars in ${this.getCurrentMonthKey()}).`;
      logger.warn({ charactersUsed, limit, requested: charactersToTranslate }, msg);
      throw new AppError(msg, 429);
    }
  }

  async recordUsage(characterCount: number): Promise<void> {
    if (characterCount <= 0) return;
    const month = this.getCurrentMonthKey();

    try {
      await db.query(
        `
        INSERT INTO translation_usage (month, characters_used, translations_count, updated_at)
        VALUES ($1, $2, 1, NOW())
        ON CONFLICT (month) DO UPDATE SET
          characters_used = translation_usage.characters_used + EXCLUDED.characters_used,
          translations_count = translation_usage.translations_count + 1,
          updated_at = NOW()
        `,
        [month, characterCount]
      );
    } catch (err: any) {
      logger.error({ err: err?.message }, '[TranslationQuotaService] Failed to record translation usage');
    }
  }

  async getStats(): Promise<TranslationQuotaStats> {
    const month = this.getCurrentMonthKey();
    const limit = this.getMonthlyLimit();
    const { charactersUsed, translationsCount } = await this.getCurrentUsage();
    const remaining = Math.max(0, limit - charactersUsed);
    const percent = limit > 0 ? Number(((charactersUsed / limit) * 100).toFixed(2)) : 0;
    const totalCachedItems = await translationCacheService.getTotalCachedCount();

    const apiKey =
      config.GOOGLE_TRANSLATE_API_KEY ||
      config.GOOGLE_CLOUD_TRANSLATE_API_KEY ||
      process.env.GOOGLE_TRANSLATE_API_KEY ||
      process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY;

    return {
      month,
      charactersUsed,
      characterLimit: limit,
      remainingCharacters: remaining,
      percentUsed: percent,
      isLimitExceeded: charactersUsed >= limit,
      totalTranslationsCount: translationsCount,
      totalCachedItems,
      isConfigured: !!apiKey,
      provider: config.TRANSLATION_PROVIDER || 'google'
    };
  }
}

export const translationQuotaService = new TranslationQuotaService();
