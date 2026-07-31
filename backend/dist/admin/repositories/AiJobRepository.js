"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiJobRepository = void 0;
const supabase_1 = require("../../database/supabase");
const appError_1 = require("../../errors/appError");
class AiJobRepository {
    tableName = 'ai_jobs';
    async findAll(page = 1, limit = 10, status) {
        let query = supabase_1.supabase
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
        if (error)
            throw error;
        return { data: data, count: count || 0 };
    }
    async getStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString();
        // In a real app we might use aggregate functions, for simplicity we'll just fetch small counts or use multiple queries.
        const [{ count: pendingCount }, { count: processingCount }, { count: completedCount }, { count: failedCount }, { count: todayCount }] = await Promise.all([
            supabase_1.supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
            supabase_1.supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('status', 'PROCESSING'),
            supabase_1.supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
            supabase_1.supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('status', 'FAILED'),
            supabase_1.supabase.from(this.tableName).select('*', { count: 'exact', head: true }).gte('created_at', todayStr)
        ]);
        return {
            pending: pendingCount || 0,
            processing: processingCount || 0,
            completed: completedCount || 0,
            failed: failedCount || 0,
            today: todayCount || 0
        };
    }
    async findById(id) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw new appError_1.NotFoundError('AI Job not found');
        return data;
    }
    async create(dto) {
        const { data, error } = await supabase_1.supabase
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
        if (error)
            throw error;
        return data;
    }
    async updateStatus(id, status, errorMessage) {
        const updateData = { status };
        if (errorMessage !== undefined)
            updateData.error_message = errorMessage;
        if (status === 'PROCESSING')
            updateData.started_at = new Date().toISOString();
        if (status === 'COMPLETED' || status === 'FAILED')
            updateData.completed_at = new Date().toISOString();
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async delete(id) {
        const { error } = await supabase_1.supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);
        if (error)
            throw error;
    }
}
exports.AiJobRepository = AiJobRepository;
