import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../database/supabase';
import { IBaseRepository } from '../interfaces/repositories';

export class BaseRepository<T> implements IBaseRepository<T> {
  protected readonly tableName: string;
  protected readonly db: SupabaseClient;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.db = supabase;
  }

  public async findAll(options?: { select?: string; order?: { column: string; ascending?: boolean } }): Promise<T[]> {
    let query = this.db.from(this.tableName).select(options?.select || '*');
    
    if (options?.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as T[];
  }

  public async findById(id: string): Promise<T | null> {
    const { data, error } = await this.db.from(this.tableName).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
    return (data as unknown as T) || null;
  }

  public async findBySlug(slug: string): Promise<T | null> {
    const { data, error } = await this.db.from(this.tableName).select('*').eq('slug', slug).single();
    if (error && error.code !== 'PGRST116') throw error;
    return (data as unknown as T) || null;
  }

  public async create(data: Partial<T>): Promise<T> {
    const { data: created, error } = await this.db.from(this.tableName).insert(data).select().single();
    if (error) throw error;
    return created as unknown as T;
  }

  public async update(id: string, data: Partial<T>): Promise<T> {
    const { data: updated, error } = await this.db.from(this.tableName).update(data).eq('id', id).select().single();
    if (error) throw error;
    return updated as unknown as T;
  }

  public async delete(id: string): Promise<boolean> {
    const { error } = await this.db.from(this.tableName).delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  public async paginate(page: number, limit: number, filters?: Record<string, any>): Promise<{ data: T[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    
    let query = this.db.from(this.tableName).select('*', { count: 'exact' });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    return {
      data: (data as unknown as T[]) || [],
      total: count || 0,
      page,
      limit,
    };
  }

  public async search(queryText: string, options?: { select?: string, limit?: number }): Promise<T[]> {
    // Assuming FTS column is search_vector, this is a basic wrapper.
    // For specific advanced searching, subclasses should override this.
    const { data, error } = await this.db
      .from(this.tableName)
      .select(options?.select || '*')
      .textSearch('search_vector', queryText, { config: 'english' })
      .limit(options?.limit || 20);

    if (error) throw error;
    return data as unknown as T[];
  }
}
