import { supabase } from '../database/supabase';
import { Category, CreateCategoryDTO, UpdateCategoryDTO } from '../models/Category';
import { ConflictError, NotFoundError } from '../errors/appError';

export class CategoryRepository {
  private readonly tableName = 'categories';

  private mapToModel(row: any): Category {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      imageUrl: row.image_url,
      iconUrl: row.icon_url,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      displayOrder: row.display_order,
      status: row.status,
      showInNavigation: row.show_in_navigation,
      isFeatured: row.is_featured,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      bhajanCount: row.bhajan_count || 0
    };
  }

  private mapToDb(dto: Partial<CreateCategoryDTO>): any {
    const dbData: any = {};
    if (dto.name !== undefined) dbData.name = dto.name;
    if (dto.slug !== undefined) dbData.slug = dto.slug;
    if (dto.description !== undefined) dbData.description = dto.description;
    if (dto.imageUrl !== undefined) dbData.image_url = dto.imageUrl;
    if (dto.iconUrl !== undefined) dbData.icon_url = dto.iconUrl;
    if (dto.seoTitle !== undefined) dbData.seo_title = dto.seoTitle;
    if (dto.seoDescription !== undefined) dbData.seo_description = dto.seoDescription;
    if (dto.displayOrder !== undefined) dbData.display_order = dto.displayOrder;
    if (dto.status !== undefined) dbData.status = dto.status;
    if (dto.showInNavigation !== undefined) dbData.show_in_navigation = dto.showInNavigation;
    if (dto.isFeatured !== undefined) dbData.is_featured = dto.isFeatured;
    return dbData;
  }

  async findAll(options: { search?: string, sort?: string, order?: 'asc' | 'desc', page?: number, limit?: number } = {}): Promise<{ data: Category[], total: number }> {
    const { search, sort = 'created_at', order = 'desc', page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    let query = supabase.from(this.tableName).select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    query = query.order(sort === 'name' ? 'name' : sort === 'displayOrder' ? 'display_order' : 'created_at', { ascending: order === 'asc' });
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    // Fetch bhajan counts (assuming bhajans table exists and has category_id)
    // For now, we return 0 as placeholder. In a real scenario with a join, we could aggregate.
    
    return { data: data.map(this.mapToModel), total: count || 0 };
  }

  async findById(id: string): Promise<Category | null> {
    const { data, error } = await supabase.from(this.tableName).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return this.mapToModel(data);
  }

  async create(dto: CreateCategoryDTO): Promise<Category> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert([this.mapToDb(dto)])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ConflictError('Category slug already exists');
      throw error;
    }
    return this.mapToModel(data);
  }

  async update(id: string, dto: UpdateCategoryDTO): Promise<Category> {
    const dbData = this.mapToDb(dto);
    dbData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from(this.tableName)
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ConflictError('Category slug already exists');
      throw error;
    }
    return this.mapToModel(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(this.tableName).delete().eq('id', id);
    if (error) throw error;
  }
}

export const categoryRepository = new CategoryRepository();
