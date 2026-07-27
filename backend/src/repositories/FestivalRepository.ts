import { supabase } from '../database/supabase';
import { Festival, CreateFestivalDTO, UpdateFestivalDTO } from '../models/Festival';
import { ConflictError, NotFoundError } from '../errors/appError';

export class FestivalRepository {
  private readonly tableName = 'festivals';

  private mapToModel(row: any): Festival {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      shortDescription: row.short_description,
      content: row.content,
      bannerImage: row.banner_image,
      festivalDate: row.festival_date,
      category: row.category,
      featured: row.featured,
      status: row.status,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      bhajanIds: row.festival_bhajans?.map((fb: any) => fb.bhajan_id) || [],
      articleIds: row.festival_articles?.map((fa: any) => fa.article_id) || [],
    };
  }

  private mapToDb(dto: Partial<CreateFestivalDTO>): any {
    const dbData: any = {};
    if (dto.name !== undefined) dbData.name = dto.name;
    if (dto.slug !== undefined) dbData.slug = dto.slug;
    if (dto.shortDescription !== undefined) dbData.short_description = dto.shortDescription;
    if (dto.content !== undefined) dbData.content = dto.content;
    if (dto.bannerImage !== undefined) dbData.banner_image = dto.bannerImage;
    if (dto.festivalDate !== undefined) dbData.festival_date = dto.festivalDate;
    if (dto.category !== undefined) dbData.category = dto.category;
    if (dto.featured !== undefined) dbData.featured = dto.featured;
    if (dto.status !== undefined) dbData.status = dto.status;
    if (dto.seoTitle !== undefined) dbData.seo_title = dto.seoTitle;
    if (dto.seoDescription !== undefined) dbData.seo_description = dto.seoDescription;
    return dbData;
  }

  async findAll(options: { search?: string, sort?: string, order?: 'asc' | 'desc', page?: number, limit?: number } = {}): Promise<{ data: Festival[], total: number }> {
    const { search, sort = 'created_at', order = 'desc', page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    let query = supabase
      .from(this.tableName)
      .select('*, festival_bhajans(bhajan_id), festival_articles(article_id)', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    query = query.order(sort === 'name' ? 'name' : sort === 'festivalDate' ? 'festival_date' : 'created_at', { ascending: order === 'asc' });
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: data.map((d: any) => this.mapToModel(d)), total: count || 0 };
  }

  async findById(id: string): Promise<Festival | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*, festival_bhajans(bhajan_id), festival_articles(article_id)')
      .eq('id', id)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return this.mapToModel(data);
  }

  async create(dto: CreateFestivalDTO): Promise<Festival> {
    const dbData = this.mapToDb(dto);
    const { data, error } = await supabase
      .from(this.tableName)
      .insert([dbData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ConflictError('Festival slug already exists');
      throw error;
    }

    await this.updateRelations(data.id, dto.bhajanIds, dto.articleIds);

    return this.findById(data.id) as Promise<Festival>;
  }

  async update(id: string, dto: UpdateFestivalDTO): Promise<Festival> {
    const dbData = this.mapToDb(dto);
    dbData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from(this.tableName)
      .update(dbData)
      .eq('id', id);

    if (error) {
      if (error.code === '23505') throw new ConflictError('Festival slug already exists');
      throw error;
    }

    await this.updateRelations(id, dto.bhajanIds, dto.articleIds);

    return this.findById(id) as Promise<Festival>;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(this.tableName).delete().eq('id', id);
    if (error) throw error;
  }
  
  async bulkAction(ids: string[], action: 'publish' | 'draft' | 'delete'): Promise<void> {
    if (action === 'delete') {
      const { error } = await supabase.from(this.tableName).delete().in('id', ids);
      if (error) throw error;
    } else {
      const status = action === 'publish' ? 'Published' : 'Draft';
      const { error } = await supabase.from(this.tableName).update({ status, updated_at: new Date().toISOString() }).in('id', ids);
      if (error) throw error;
    }
  }

  private async updateRelations(festivalId: string, bhajanIds?: string[], articleIds?: string[]) {
    if (bhajanIds !== undefined) {
      await supabase.from('festival_bhajans').delete().eq('festival_id', festivalId);
      if (bhajanIds.length > 0) {
        const bhajanInserts = bhajanIds.map(id => ({ festival_id: festivalId, bhajan_id: id }));
        await supabase.from('festival_bhajans').insert(bhajanInserts);
      }
    }

    if (articleIds !== undefined) {
      await supabase.from('festival_articles').delete().eq('festival_id', festivalId);
      if (articleIds.length > 0) {
        const articleInserts = articleIds.map(id => ({ festival_id: festivalId, article_id: id }));
        await supabase.from('festival_articles').insert(articleInserts);
      }
    }
  }
}

export const festivalRepository = new FestivalRepository();
