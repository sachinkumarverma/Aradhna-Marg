import crypto from 'crypto';
import { db } from '@common/database/DatabaseClient';
import { logger } from '@utils/logger';

interface CacheEntry {
  translatedText: string;
  provider: string;
  createdAt: number;
}

export class TranslationCacheService {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private readonly maxMemoryEntries = 1000;

  private computeHash(text: string, sourceLang: string, targetLang: string, format: string): string {
    const raw = `${sourceLang.trim().toLowerCase()}:${targetLang.trim().toLowerCase()}:${format.trim().toLowerCase()}:${text}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  async get(
    text: string,
    sourceLang: string,
    targetLang: string,
    format: string
  ): Promise<{ translated: string; provider: string } | null> {
    if (!text || text.trim() === '') {
      return { translated: '', provider: 'cache' };
    }

    const hash = this.computeHash(text, sourceLang, targetLang, format);

    // 1. Check memory cache (0ms)
    const memEntry = this.memoryCache.get(hash);
    if (memEntry) {
      return { translated: memEntry.translatedText, provider: `${memEntry.provider}:cache-mem` };
    }

    // 2. Check PostgreSQL persistent cache
    try {
      const res = await db.query(
        `SELECT translated_text, provider FROM translation_cache WHERE text_hash = $1 LIMIT 1`,
        [hash]
      );

      if (res.rows.length > 0) {
        const row = res.rows[0];
        // Populate memory cache
        this.setMemoryCache(hash, row.translated_text, row.provider);
        return { translated: row.translated_text, provider: `${row.provider}:cache-db` };
      }
    } catch (err: any) {
      logger.warn({ err: err?.message }, '[TranslationCacheService] Failed to read from DB cache');
    }

    return null;
  }

  async set(
    text: string,
    translatedText: string,
    sourceLang: string,
    targetLang: string,
    format: string,
    provider: string
  ): Promise<void> {
    if (!text || text.trim() === '') return;

    const hash = this.computeHash(text, sourceLang, targetLang, format);
    const charCount = text.length;

    // 1. Store in memory cache
    this.setMemoryCache(hash, translatedText, provider);

    // 2. Persist in database cache
    try {
      await db.query(
        `
        INSERT INTO translation_cache (
          text_hash, source_lang, target_lang, format,
          source_text, translated_text, character_count, provider, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (text_hash) DO UPDATE SET
          translated_text = EXCLUDED.translated_text,
          provider = EXCLUDED.provider,
          updated_at = NOW()
        `,
        [hash, sourceLang, targetLang, format, text, translatedText, charCount, provider]
      );
    } catch (err: any) {
      logger.warn({ err: err?.message }, '[TranslationCacheService] Failed to persist translation in DB cache');
    }
  }

  private setMemoryCache(hash: string, translatedText: string, provider: string): void {
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      // Evict oldest entry
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) this.memoryCache.delete(firstKey);
    }
    this.memoryCache.set(hash, {
      translatedText,
      provider,
      createdAt: Date.now()
    });
  }

  async getTotalCachedCount(): Promise<number> {
    try {
      const res = await db.query(`SELECT COUNT(*)::int as count FROM translation_cache`);
      return res.rows[0]?.count || 0;
    } catch (err: any) {
      logger.warn({ err: err?.message }, '[TranslationCacheService] Failed to count DB cache');
      return this.memoryCache.size;
    }
  }

  clearMemoryCache(): void {
    this.memoryCache.clear();
  }
}

export const translationCacheService = new TranslationCacheService();
