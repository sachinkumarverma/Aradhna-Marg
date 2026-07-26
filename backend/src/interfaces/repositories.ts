/**
 * Base Repository Interface following Clean Architecture
 */
export interface IBaseRepository<T> {
  findAll(options?: any): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  findBySlug(slug: string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  paginate(page: number, limit: number, filters?: any): Promise<{ data: T[]; total: number; page: number; limit: number }>;
  search(query: string, options?: any): Promise<T[]>;
}

export interface IBhajanRepository extends IBaseRepository<any> {
  findByVideoId(videoId: string): Promise<any | null>;
  incrementViews(id: string): Promise<void>;
  findRelated(id: string, limit?: number): Promise<any[]>;
  getTrending(limit?: number): Promise<any[]>;
}

export interface ICategoryRepository extends IBaseRepository<any> {
  getPopular(limit?: number): Promise<any[]>;
}

export interface IFestivalRepository extends IBaseRepository<any> {
  findUpcoming(limit?: number): Promise<any[]>;
}

export interface IGodRepository extends IBaseRepository<any> {
  // God-specific repo methods
}

export interface IAdvertisementRepository extends IBaseRepository<any> {
  findActiveByPosition(position: 'HEADER' | 'SIDEBAR' | 'INLINE' | 'BOTTOM' | 'MOBILE_STICKY'): Promise<any[]>;
}

export interface ISettingsRepository {
  getSettings(): Promise<any>;
  updateSettings(data: any): Promise<any>;
}

export interface IAnalyticsRepository {
  logPageView(data: any): Promise<void>;
  logSearch(term: string, metadata: any): Promise<void>;
  getStats(startDate: Date, endDate: Date): Promise<any>;
}
