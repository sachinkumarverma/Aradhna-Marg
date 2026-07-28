import { supabase } from '../../config/supabase';
import { Deity, CreateDeityDTO, UpdateDeityDTO } from '../../models/Deity';

export class DeityRepository {
  private tableName = 'deities';

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
      .order('displayOrder', { ascending: true })
      .order('createdAt', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      data,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  }

  async findById(id: string) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async findBySlug(slug: string) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(data: CreateDeityDTO & { createdBy?: string }) {
    const { data: created, error } = await supabase
      .from(this.tableName)
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return created;
  }

  async update(id: string, data: UpdateDeityDTO & { updatedBy?: string }) {
    const { data: updated, error } = await supabase
      .from(this.tableName)
      .update({ ...data, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}
