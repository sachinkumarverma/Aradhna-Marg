import { BaseRepository } from './base.repository';

export class BhajanRepository extends BaseRepository<any> {
  constructor() {
    super('bhajans');
  }

  public async getList(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    category?: string;
    primaryDeity?: string;
    sort?: string;
  }) {
    const { page, limit, search, status, category, primaryDeity, sort } = params;
    const offset = (page - 1) * limit;

    let query = this.db.from(this.tableName)
      .select('id, title, slug, status, views, created_at, category_id, categories(name), god_id, gods(name)', { count: 'exact' })
      .is('deleted_at', null);

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category_id', category);
    if (primaryDeity) query = query.eq('god_id', primaryDeity);

    if (search) {
      query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%,lyrics.ilike.%${search}%`);
    }

    if (sort === 'newest') query = query.order('created_at', { ascending: false });
    else if (sort === 'oldest') query = query.order('created_at', { ascending: true });
    else if (sort === 'alphabetical') query = query.order('title', { ascending: true });
    else if (sort === 'views') query = query.order('views', { ascending: false });
    else query = query.order('created_at', { ascending: false }); // Default

    const { data, count, error } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    return { data, count };
  }

  public async getByIdWithRelations(id: string) {
    const { data, error } = await this.db.from(this.tableName)
      .select(`
        *,
        categories(id, name),
        gods(id, name),
        bhajan_gods(god_id)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data;
  }

  public async updateAdditionalDeities(bhajanId: string, deityIds: string[]) {
    // Delete existing
    await this.db.from('bhajan_gods').delete().eq('bhajan_id', bhajanId);
    
    // Insert new
    if (deityIds && deityIds.length > 0) {
      const inserts = deityIds.map(id => ({ bhajan_id: bhajanId, god_id: id }));
      const { error } = await this.db.from('bhajan_gods').insert(inserts);
      if (error) throw error;
    }
  }

  public async softDelete(id: string) {
    return this.update(id, { deleted_at: new Date().toISOString() });
  }

  public async bulkAction(ids: string[], action: 'PUBLISH' | 'DRAFT' | 'ARCHIVE' | 'DELETE') {
    if (action === 'DELETE') {
      const { error } = await this.db.from(this.tableName)
        .update({ deleted_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
    } else {
      let status = 'DRAFT';
      if (action === 'PUBLISH') status = 'PUBLISHED';
      if (action === 'ARCHIVE') status = 'ARCHIVED';

      const { error } = await this.db.from(this.tableName)
        .update({ status })
        .in('id', ids);
      if (error) throw error;
    }
  }
}

export const bhajanRepository = new BhajanRepository();
