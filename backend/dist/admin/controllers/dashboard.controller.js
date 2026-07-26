"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = void 0;
const apiResponse_1 = require("../../responses/apiResponse");
const supabase_1 = require("../../database/supabase");
class DashboardController {
    getStats = async (req, res, next) => {
        try {
            // In production, these would be cached or calculated via materialized views
            const [{ count: totalBhajans }, { count: publishedBhajans }, { count: pendingAi }, { count: totalCategories }] = await Promise.all([
                supabase_1.supabase.from('bhajans').select('*', { count: 'exact', head: true }),
                supabase_1.supabase.from('bhajans').select('*', { count: 'exact', head: true }).eq('status', 'PUBLISHED'),
                supabase_1.supabase.from('bhajans').select('*', { count: 'exact', head: true }).eq('metadata_status', 'PENDING'),
                supabase_1.supabase.from('categories').select('*', { count: 'exact', head: true })
            ]);
            const stats = {
                totalBhajans: totalBhajans || 0,
                published: publishedBhajans || 0,
                draft: (totalBhajans || 0) - (publishedBhajans || 0),
                pendingAi: pendingAi || 0,
                failedAi: 0, // Mocked
                pendingPdfs: 0, // Mocked
                totalCategories: totalCategories || 0,
                totalFestivals: 45, // Mocked
                totalGods: 32, // Mocked
                todayViews: 1250, // Mocked
                monthViews: 45000 // Mocked
            };
            return (0, apiResponse_1.sendSuccess)(res, 'Dashboard stats fetched', stats);
        }
        catch (error) {
            next(error);
        }
    };
    getRecentActivity = async (req, res, next) => {
        try {
            const { data } = await supabase_1.supabase
                .from('bhajans')
                .select('id, title, status, created_at, metadata_status')
                .order('created_at', { ascending: false })
                .limit(10);
            return (0, apiResponse_1.sendSuccess)(res, 'Recent activity fetched', { activity: data });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.dashboardController = new DashboardController();
