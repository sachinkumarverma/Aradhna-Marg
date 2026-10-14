import { Response } from 'express';

interface CacheEntry<T> {
  data: T;
  meta?: any;
  timestamp: number;
  ttlMs: number;
}

export class PublicCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly maxEntries = 1000;

  /**
   * Retrieves an item from cache if it exists and has not expired.
   */
  public get<T>(key: string): { data: T; meta?: any } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return { data: entry.data, meta: entry.meta };
  }

  /**
   * Stores an item in cache with a TTL in seconds.
   */
  public set(key: string, data: any, ttlSeconds: number = 180, meta?: any): void {
    if (this.cache.size >= this.maxEntries) {
      // Evict oldest 150 items
      const keysToEvict = Array.from(this.cache.keys()).slice(0, 150);
      for (const k of keysToEvict) {
        this.cache.delete(k);
      }
    }

    this.cache.set(key, {
      data,
      meta,
      timestamp: Date.now(),
      ttlMs: ttlSeconds * 1000
    });
  }

  /**
   * Invalidates keys matching a given prefix or pattern.
   */
  public invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears the entire public cache.
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Attaches standard HTTP caching headers for public read-only responses.
   * Browsers cache for maxAgeSec (default 60s).
   * Edge CDN (Cloudflare on Render) caches for sMaxAgeSec (default 300s).
   * Stale-while-revalidate serves instant stale content while fetching fresh data in the background.
   */
  public setCacheHeaders(res: Response, maxAgeSec: number = 60, sMaxAgeSec: number = 300): void {
    res.setHeader(
      'Cache-Control',
      `public, max-age=${maxAgeSec}, s-maxage=${sMaxAgeSec}, stale-while-revalidate=${sMaxAgeSec * 2}`
    );
  }
}

export const publicCacheService = new PublicCacheService();
