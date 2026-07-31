import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/responses/apiResponse';
import { db } from '@common/database/DatabaseClient';

class DashboardController {
  public getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // In production, these would be cached or calculated via materialized views
      const [
        { rows: [{ total: totalBhajans }] },
        { rows: [{ total: publishedBhajans }] },
        { rows: [{ total: pendingAi }] },
        { rows: [{ total: totalCategories }] }
      ] = await Promise.all([
        db.query(`SELECT COUNT(*) as total FROM bhajans WHERE youtube_video_id IS NULL AND deleted_at IS NULL`),
        db.query(`SELECT COUNT(*) as total FROM bhajans WHERE status = 'PUBLISHED' AND youtube_video_id IS NULL AND deleted_at IS NULL`),
        db.query(`SELECT COUNT(*) as total FROM bhajans WHERE metadata_status = 'PENDING' AND youtube_video_id IS NULL AND deleted_at IS NULL`),
        db.query(`SELECT COUNT(*) as total FROM categories WHERE deleted_at IS NULL`)
      ]);

      const tb = parseInt(totalBhajans, 10) || 0;
      const pb = parseInt(publishedBhajans, 10) || 0;
      const pa = parseInt(pendingAi, 10) || 0;
      const tc = parseInt(totalCategories, 10) || 0;

      const stats = {
        totalBhajans: tb,
        published: pb,
        draft: tb - pb,
        pendingAi: pa,
        failedAi: 0, // Mocked
        pendingPdfs: 0, // Mocked
        totalCategories: tc,
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
      const { rows } = await db.query(`
        SELECT id, title, status, created_at, metadata_status
        FROM bhajans
        WHERE youtube_video_id IS NULL AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 10
      `);

      return sendSuccess(res, 'Recent activity fetched', { activity: rows });
    } catch (error) {
      next(error);
    }
  };
}

export const dashboardController = new DashboardController();
