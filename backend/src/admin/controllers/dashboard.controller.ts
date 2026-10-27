import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/responses/apiResponse';
import { db } from '@common/database/DatabaseClient';

class DashboardController {
  public getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // In production, these would be cached or calculated via materialized views
      const [
        {
          rows: [{ total: totalBhajans }]
        },
        {
          rows: [{ total: publishedBhajans }]
        },
        {
          rows: [{ total: pendingAi }]
        },
        {
          rows: [{ total: failedAi }]
        },
        {
          rows: [{ total: totalCategories }]
        },
        {
          rows: [{ total: totalFestivals }]
        },
        {
          rows: [{ total: totalGods }]
        },
        {
          rows: [viewsStats]
        },
        {
          rows: [pwaStats]
        }
      ] = await Promise.all([
        db.query(`SELECT COUNT(*) as total FROM bhajans WHERE youtube_video_id IS NULL AND deleted_at IS NULL`),
        db.query(
          `SELECT COUNT(*) as total FROM bhajans WHERE status = 'PUBLISHED' AND youtube_video_id IS NULL AND deleted_at IS NULL`
        ),
        db.query(`SELECT COUNT(*) as total FROM ai_jobs WHERE status = 'PENDING'`),
        db.query(`SELECT COUNT(*) as total FROM ai_jobs WHERE status = 'FAILED'`),
        db.query(`SELECT COUNT(*) as total FROM categories`),
        db.query(`SELECT COUNT(*) as total FROM festivals`),
        db.query(`SELECT COUNT(*) as total FROM gods`),
        db.query(`
          SELECT 
            COALESCE((SELECT SUM(views) FROM bhajans WHERE deleted_at IS NULL), 0) as bhajan_views,
            COALESCE((SELECT SUM(view_count) FROM articles WHERE deleted_at IS NULL), 0) as article_views,
            COALESCE((SELECT SUM(view_count) FROM puranas WHERE deleted_at IS NULL), 0) as puran_views,
            (
              COALESCE((SELECT SUM(views) FROM bhajans WHERE deleted_at IS NULL), 0) +
              COALESCE((SELECT SUM(view_count) FROM articles WHERE deleted_at IS NULL), 0) +
              COALESCE((SELECT SUM(view_count) FROM puranas WHERE deleted_at IS NULL), 0)
            ) as total_views
        `),
        db
          .query(
            `
          SELECT 
            COUNT(*) as total_installs,
            COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_installs,
            COUNT(*) FILTER (WHERE platform = 'android') as android_installs,
            COUNT(*) FILTER (WHERE platform = 'ios') as ios_installs,
            COUNT(*) FILTER (WHERE platform = 'desktop') as desktop_installs
          FROM pwa_installs
        `
          )
          .catch(() => ({
            rows: [
              {
                total_installs: '0',
                today_installs: '0',
                android_installs: '0',
                ios_installs: '0',
                desktop_installs: '0'
              }
            ]
          }))
      ]);

      const tb = parseInt(totalBhajans, 10) || 0;
      const pb = parseInt(publishedBhajans, 10) || 0;
      const pa = parseInt(pendingAi, 10) || 0;
      const fa = parseInt(failedAi, 10) || 0;
      const tc = parseInt(totalCategories, 10) || 0;
      const tf = parseInt(totalFestivals, 10) || 0;
      const tg = parseInt(totalGods, 10) || 0;
      const realTotalViews = parseInt(viewsStats?.total_views || '0', 10);
      const bhajanViews = parseInt(viewsStats?.bhajan_views || '0', 10);
      const articleViews = parseInt(viewsStats?.article_views || '0', 10);
      const puranViews = parseInt(viewsStats?.puran_views || '0', 10);

      const stats = {
        totalBhajans: tb,
        published: pb,
        draft: tb - pb,
        pendingAi: pa,
        failedAi: fa,
        pendingPdfs: 0,
        totalCategories: tc,
        totalFestivals: tf,
        totalGods: tg,
        totalViews: realTotalViews,
        todayViews: realTotalViews,
        monthViews: realTotalViews,
        bhajanViews,
        articleViews,
        puranViews,
        pwaInstalls: {
          total: parseInt(pwaStats?.total_installs || '0', 10),
          today: parseInt(pwaStats?.today_installs || '0', 10),
          android: parseInt(pwaStats?.android_installs || '0', 10),
          ios: parseInt(pwaStats?.ios_installs || '0', 10),
          desktop: parseInt(pwaStats?.desktop_installs || '0', 10)
        }
      };

      return sendSuccess(res, 'Dashboard stats fetched', stats);
    } catch (error) {
      next(error);
    }
  };

  public getRecentActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 5, 1), 50);
      const { rows } = await db.query(
        `
        SELECT id, title, status, created_at
        FROM bhajans
        WHERE youtube_video_id IS NULL AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT $1
      `,
        [limit]
      );

      return sendSuccess(res, 'Recent activity fetched', { activity: rows });
    } catch (error) {
      next(error);
    }
  };
}

export const dashboardController = new DashboardController();
