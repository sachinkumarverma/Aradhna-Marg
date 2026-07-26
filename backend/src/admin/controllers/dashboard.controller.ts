import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../responses/apiResponse';
import { supabase } from '../../database/supabase';

class DashboardController {
  public getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // In production, these would be cached or calculated via materialized views
      const [
        { count: totalBhajans },
        { count: publishedBhajans },
        { count: pendingAi },
        { count: totalCategories }
      ] = await Promise.all([
        supabase.from('bhajans').select('*', { count: 'exact', head: true }),
        supabase.from('bhajans').select('*', { count: 'exact', head: true }).eq('status', 'PUBLISHED'),
        supabase.from('bhajans').select('*', { count: 'exact', head: true }).eq('metadata_status', 'PENDING'),
        supabase.from('categories').select('*', { count: 'exact', head: true })
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

      return sendSuccess(res, 'Dashboard stats fetched', stats);
    } catch (error) {
      next(error);
    }
  };

  public getRecentActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data } = await supabase
        .from('bhajans')
        .select('id, title, status, created_at, metadata_status')
        .order('created_at', { ascending: false })
        .limit(10);

      return sendSuccess(res, 'Recent activity fetched', { activity: data });
    } catch (error) {
      next(error);
    }
  };
}

export const dashboardController = new DashboardController();
