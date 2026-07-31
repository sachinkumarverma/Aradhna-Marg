"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = void 0;
const apiResponse_1 = require("../../responses/apiResponse");
const DatabaseClient_1 = require("../../common/database/DatabaseClient");
class DashboardController {
    getStats = async (req, res, next) => {
        try {
            // In production, these would be cached or calculated via materialized views
            const [{ rows: [{ total: totalBhajans }] }, { rows: [{ total: publishedBhajans }] }, { rows: [{ total: pendingAi }] }, { rows: [{ total: totalCategories }] }] = await Promise.all([
                DatabaseClient_1.db.query(`SELECT COUNT(*) as total FROM bhajans WHERE youtube_video_id IS NULL AND deleted_at IS NULL`),
                DatabaseClient_1.db.query(`SELECT COUNT(*) as total FROM bhajans WHERE status = 'PUBLISHED' AND youtube_video_id IS NULL AND deleted_at IS NULL`),
                DatabaseClient_1.db.query(`SELECT COUNT(*) as total FROM bhajans WHERE metadata_status = 'PENDING' AND youtube_video_id IS NULL AND deleted_at IS NULL`),
                DatabaseClient_1.db.query(`SELECT COUNT(*) as total FROM categories WHERE deleted_at IS NULL`)
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
            return (0, apiResponse_1.sendSuccess)(res, 'Dashboard stats fetched', stats);
        }
        catch (error) {
            next(error);
        }
    };
    getRecentActivity = async (req, res, next) => {
        try {
            const { rows } = await DatabaseClient_1.db.query(`
        SELECT id, title, status, created_at, metadata_status
        FROM bhajans
        WHERE youtube_video_id IS NULL AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 10
      `);
            return (0, apiResponse_1.sendSuccess)(res, 'Recent activity fetched', { activity: rows });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.dashboardController = new DashboardController();
