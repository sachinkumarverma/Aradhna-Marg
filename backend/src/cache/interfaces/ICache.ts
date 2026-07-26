export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clearPattern(pattern: string): Promise<void>;
  flush(): Promise<void>;
}
