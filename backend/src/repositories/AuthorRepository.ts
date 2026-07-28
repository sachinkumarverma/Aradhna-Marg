import { supabase } from '../database/supabase';
import { Author, CreateAuthorDTO, UpdateAuthorDTO } from '../models/Author';
import { ConflictError, NotFoundError } from '../errors/appError';

export class AuthorRepository {
  private readonly tableName = 'authors';

  private mapToModel(row: any): Author {
    return {
      id: row.id,
      name: row.name,
      photo: row.photo,
      shortDescription: row.short_description,
      status: row.status,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at
    };
  }

  private mapToDb(dto: Partial<CreateAuthorDTO>): any {
    const dbData: any = {};
    if (dto.name !== undefined) dbData.name = dto.name;
    if (dto.photo !== undefined) dbData.photo = dto.photo;
    if (dto.shortDescription !== undefined) dbData.short_description = dto.shortDescription;
    if (dto.status !== undefined) dbData.status = dto.status;
    if (dto.seoTitle !== undefined) dbData.seo_title = dto.seoTitle;
    if (dto.seoDescription !== undefined) dbData.seo_description = dto.seoDescription;
    return dbData;
  }

  async findAll(options: { search?: string, sort?: string, order?: 'asc' | 'desc', page?: number, limit?: number, status?: string } = {}): Promise<{ data: Author[], total: number }> {
    const { search, sort = 'created_at', order = 'desc', page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;

    let query = supabase.from(this.tableName).select('*', { count: 'exact' });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order(sort === 'name' ? 'name' : 'created_at', { ascending: order === 'asc' });
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    
    return { data: data.map(this.mapToModel), total: count || 0 };
  }

  async findById(id: string): Promise<Author | null> {
    const { data, error } = await supabase.from(this.tableName).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return this.mapToModel(data);
  }

  async create(dto: CreateAuthorDTO): Promise<Author> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert([this.mapToDb(dto)])
      .select()
      .single();

    if (error) throw error;
    return this.mapToModel(data);
  }

  async update(id: string, dto: UpdateAuthorDTO): Promise<Author> {
    const dbData = this.mapToDb(dto);
    dbData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from(this.tableName)
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToModel(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(this.tableName).delete().eq('id', id);
    if (error) throw error;
  }
}

export const authorRepository = new AuthorRepository();
