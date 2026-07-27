import { BaseRepository } from './base.repository';

export class PuranRepository extends BaseRepository<any> {
  constructor() {
    super('puranas');
  }

  public async getList(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    language?: string;
    sort?: string;
  }) {
    const { page, limit, search, status, language, sort } = params;
    const offset = (page - 1) * limit;

    let query = this.db.from(this.tableName).select('*', { count: 'exact' }).is('deleted_at', null);

    if (status) query = query.eq('status', status);
    if (language) query = query.eq('language', language);
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,short_description.ilike.%${search}%`);
    }

    if (sort === 'newest') query = query.order('created_at', { ascending: false });
    else if (sort === 'oldest') query = query.order('created_at', { ascending: true });
    else if (sort === 'downloads') query = query.order('download_count', { ascending: false });
    else if (sort === 'views') query = query.order('view_count', { ascending: false });
    else if (sort === 'alphabetical') query = query.order('title', { ascending: true });
    else query = query.order('created_at', { ascending: false });

    const { data, count, error } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    return { data, count };
  }

  public async getById(id: string) {
    const { data, error } = await this.db.from(this.tableName)
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data;
  }

  public async bulkAction(ids: string[], action: string) {
    if (action === 'DELETE') {
      const { error } = await this.db.from(this.tableName)
        .update({ deleted_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
    } else {
      let status = 'DRAFT';
      if (action === 'PUBLISH') status = 'PUBLISHED';
      if (action === 'ARCHIVE') status = 'ARCHIVED';
      const { error } = await this.db.from(this.tableName).update({ status }).in('id', ids);
      if (error) throw error;
    }
  }

  public async getBySlug(slug: string) {
    const { data, error } = await this.db.from(this.tableName)
      .select('*')
      .eq('slug', slug)
      .eq('status', 'PUBLISHED')
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data;
  }

  public async getRelated(id: string, language: string, limit = 4) {
    const { data, error } = await this.db.from(this.tableName)
      .select('id, title, slug, language, cover_image, short_description')
      .eq('status', 'PUBLISHED')
      .is('deleted_at', null)
      .neq('id', id)
      .eq('language', language)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  public async incrementStats(id: string, field: 'view_count' | 'download_count') {
    // using raw rpc or fetch existing and update (supabase limitation for simple increment without RPC)
    const { data: existing } = await this.db.from(this.tableName).select(field).eq('id', id).single();
    if (existing) {
      await this.db.from(this.tableName).update({ [field]: (existing[field] || 0) + 1 }).eq('id', id);
    }
  }
}

export const puranRepository = new PuranRepository();
