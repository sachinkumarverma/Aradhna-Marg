import { ICacheService } from '@/cache/interfaces/ICache';
import { logger } from '@utils/logger';

interface CacheEntry {
  value: any;
  expiry: number | null;
}

export class MemoryCache implements ICacheService {
  private store: Map<string, CacheEntry> = new Map();

  public async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiry && Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  public async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiry });
  }

  public async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  public async clearPattern(pattern: string): Promise<void> {
    const regex = new RegExp(`^${pattern.replace('*', '.*')}$`);
    let deleted = 0;
    
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        deleted++;
      }
    }
    logger.debug(`[Cache] Cleared ${deleted} keys matching pattern ${pattern}`);
  }

  public async flush(): Promise<void> {
    this.store.clear();
    logger.info(`[Cache] Flushed entirely`);
  }
}
