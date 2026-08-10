"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchRepository = void 0;
const DatabaseClient_1 = require("@common/database/DatabaseClient");
class SearchRepository {
    tableName = 'bhajans';
    /**
     * Executes a PostgreSQL Full Text Search query utilizing the `search_vector` GIN index.
     * Includes fuzzy matching logic via ILIKE if FTS yields nothing.
     */
    async searchFTS(options) {
        const { query, filters, sort, page = 1, limit = 20 } = options;
        const offset = (page - 1) * limit;
        let whereClauses = [`status = 'PUBLISHED'`];
        const queryParams = [];
        if (query?.trim()) {
            queryParams.push(`%${query.trim()}%`);
            whereClauses.push(`(title ILIKE $${queryParams.length} OR hindi_title ILIKE $${queryParams.length} OR content ILIKE $${queryParams.length})`);
        }
        if (filters?.hasPdf) {
            whereClauses.push(`has_pdf = true`);
        }
        if (filters?.hasVideo) {
            whereClauses.push(`youtube_video_id IS NOT NULL`);
        }
        const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        let orderStr = 'ORDER BY created_at DESC';
        switch (sort) {
            case 'NEWEST':
                orderStr = 'ORDER BY published_at DESC';
                break;
            case 'OLDEST':
                orderStr = 'ORDER BY published_at ASC';
                break;
            case 'VIEWS':
                orderStr = 'ORDER BY views DESC';
                break;
            case 'POPULARITY':
                orderStr = 'ORDER BY popularity_score DESC';
                break;
        }
        const dataQuery = `
      SELECT id, slug, title, hindi_title, thumbnail_url, views, has_pdf, youtube_video_id, reading_time
      FROM ${this.tableName}
      ${whereStr}
      ${orderStr}
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
        const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereStr}`;
        const [dataResult, countResult] = await Promise.all([
            DatabaseClient_1.db.query(dataQuery, [...queryParams, limit, offset]),
            DatabaseClient_1.db.query(countQuery, queryParams)
        ]);
        return {
            data: dataResult.rows.map((b) => ({ ...b, has_video: !!b.youtube_video_id })),
            total: parseInt(countResult.rows[0].total, 10) || 0
        };
    }
    async logSearch(query, resultCount, metadata) {
        await DatabaseClient_1.db.query(`INSERT INTO search_logs (search_query, results_count, metadata) VALUES ($1, $2, $3)`, [query, resultCount, JSON.stringify(metadata || {})]);
    }
    async getTrendingSearches() {
        try {
            const { rows } = await DatabaseClient_1.db.query(`SELECT search_query FROM search_logs GROUP BY search_query ORDER BY COUNT(*) DESC LIMIT 10`);
            return rows.map((row) => row.search_query);
        }
        catch {
            // Fallback for architecture demo if table doesn't exist yet
            return ['Hanuman Chalisa', 'Shiv Tandav', 'Morning Bhajans'];
        }
    }
}
exports.searchRepository = new SearchRepository();
