"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seoRepository = exports.SeoRepository = void 0;
const DatabaseClient_1 = require("../../common/database/DatabaseClient");
class SeoRepository {
    async getTableStats(table, isBhajans = false) {
        const tableId = isBhajans ? 'youtube_video_id IS NULL' : '1=1';
        // In PostgreSQL, title column might be different per table? 
        // Wait, bhajans, articles, festivals, puranas have `title`. categories has `name`.
        const titleCol = (table === 'categories' || table === 'festivals' || table === 'deities' || table === 'tags' || table === 'authors') ? 'name' : 'title';
        // categories has `seo_title`, `seo_description`.
        // other tables have `seo_title` and `meta_description`. Let's handle these differences.
        const seoTitleCol = 'seo_title';
        const seoDescCol = 'seo_description';
        const totalQuery = `SELECT COUNT(*) as total FROM ${table} WHERE ${tableId}`;
        const missingTitleQuery = `SELECT COUNT(*) as total FROM ${table} WHERE ${tableId} AND (${seoTitleCol} IS NULL OR ${seoTitleCol} = '')`;
        const missingDescQuery = `SELECT COUNT(*) as total FROM ${table} WHERE ${tableId} AND (${seoDescCol} IS NULL OR ${seoDescCol} = '')`;
        const [totalRes, missingTitleRes, missingDescRes] = await Promise.all([
            DatabaseClient_1.db.query(totalQuery),
            DatabaseClient_1.db.query(missingTitleQuery),
            DatabaseClient_1.db.query(missingDescQuery)
        ]);
        return {
            total: parseInt(totalRes.rows[0].total, 10),
            missingTitle: parseInt(missingTitleRes.rows[0].total, 10),
            missingDesc: parseInt(missingDescRes.rows[0].total, 10)
        };
    }
    async getMissingSeoIssues(table, issueType, isBhajans = false) {
        const tableId = isBhajans ? 'youtube_video_id IS NULL' : '1=1';
        const titleCol = (table === 'categories' || table === 'festivals' || table === 'deities' || table === 'tags' || table === 'authors') ? 'name' : 'title';
        const seoTitleCol = 'seo_title';
        const seoDescCol = 'seo_description';
        const condition = issueType === 'title'
            ? `(${seoTitleCol} IS NULL OR ${seoTitleCol} = '')`
            : `(${seoDescCol} IS NULL OR ${seoDescCol} = '')`;
        const query = `
      SELECT id, ${titleCol} as title 
      FROM ${table} 
      WHERE ${tableId} AND ${condition} 
      LIMIT 10
    `;
        const res = await DatabaseClient_1.db.query(query);
        return res.rows.map(row => ({
            id: row.id,
            title: row.title,
            type: table,
            issue: issueType === 'title' ? 'Missing SEO Title' : 'Missing Meta Description'
        }));
    }
}
exports.SeoRepository = SeoRepository;
exports.seoRepository = new SeoRepository();
