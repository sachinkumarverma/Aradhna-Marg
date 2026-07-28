import { supabase } from '../../database/supabase';
import { AiJob, CreateAiJobDTO } from '../../models/AiJob';
import { NotFoundError } from '../../errors/appError';

export class AiJobRepository {
  private tableName = 'ai_jobs';

  async findAll(page: number = 1, limit: number = 10, status?: string): Promise<{ data: AiJob[]; count: number }> {
    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data: data as AiJob[], count: count || 0 };
  }
  
  async getStats(): Promise<any> {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString();
    
    // In a real app we might use aggregate functions, for simplicity we'll just fetch small counts or use multiple queries.
    const [{ count: pendingCount }, { count: processingCount }, { count: completedCount }, { count: failedCount }, { count: todayCount }] = await Promise.all([
      supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('status', 'PROCESSING'),
      supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
      supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('status', 'FAILED'),
      supabase.from(this.tableName).select('*', { count: 'exact', head: true }).gte('created_at', todayStr)
    ]);
    
    return {
      pending: pendingCount || 0,
      processing: processingCount || 0,
      completed: completedCount || 0,
      failed: failedCount || 0,
      today: todayCount || 0
    };
  }

  async findById(id: string): Promise<AiJob> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new NotFoundError('AI Job not found');
    return data as AiJob;
  }

  async create(dto: CreateAiJobDTO): Promise<AiJob> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert([
        {
          job_name: dto.job_name,
          content_type: dto.content_type,
          action_type: dto.action_type,
          total_items: dto.total_items || 1,
          status: 'PENDING'
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data as AiJob;
  }

  async updateStatus(id: string, status: string, errorMessage?: string): Promise<AiJob> {
    const updateData: any = { status };
    if (errorMessage !== undefined) updateData.error_message = errorMessage;
    if (status === 'PROCESSING') updateData.started_at = new Date().toISOString();
    if (status === 'COMPLETED' || status === 'FAILED') updateData.completed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AiJob;
  }
  
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
