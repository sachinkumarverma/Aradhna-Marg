"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DatabaseClient_1 = require("@common/database/DatabaseClient");
const apiResponse_1 = require("@/responses/apiResponse");
const router = (0, express_1.Router)();
router.get('/videos', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const excludeShorts = req.query.excludeShorts === 'true';
        const offset = (page - 1) * limit;
        let whereConditions = ["import_status != 'IGNORED'"];
        let queryParams = [];
        let paramIndex = 1;
        if (search) {
            whereConditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }
        const whereClause = whereConditions.join(' AND ');
        const query = `
      SELECT * FROM youtube_videos
      WHERE ${whereClause}
      ORDER BY published_at DESC
    `;
        const { rows } = await DatabaseClient_1.db.query(query, queryParams);
        let filtered = rows;
        if (excludeShorts) {
            filtered = filtered.filter((row) => {
                const str = (row.duration || '').toLowerCase();
                let secs = 0;
                const hMatch = str.match(/(\d+)h/);
                const mMatch = str.match(/(\d+)m/);
                const sMatch = str.match(/(\d+)s/);
                if (hMatch)
                    secs += parseInt(hMatch[1], 10) * 3600;
                if (mMatch)
                    secs += parseInt(mMatch[1], 10) * 60;
                if (sMatch)
                    secs += parseInt(sMatch[1], 10);
                // If duration is > 3 minutes (180 secs) or no duration parsed (treat as full video), keep it.
                // A short is secs > 0 and secs <= 180.
                const isShort = secs > 0 && secs <= 180;
                return !isShort;
            });
        }
        const total = filtered.length;
        const paginatedRows = filtered.slice(offset, offset + limit);
        return (0, apiResponse_1.sendSuccess)(res, 'Videos retrieved', paginatedRows, { total, page, limit, totalPages: Math.ceil(total / limit) });
    }
    catch (error) {
        next(error);
    }
});
// Get Youtube Video by ID (or slug)
router.get('/videos/:slug', async (req, res, next) => {
    try {
        const { slug } = req.params;
        // First try to find a bhajan with this slug
        let query = `SELECT * FROM bhajans WHERE slug = $1 LIMIT 1`;
        let result = await DatabaseClient_1.db.query(query, [slug]);
        if (result.rows.length === 0) {
            // If no bhajan, try youtube_videos by youtube_video_id
            query = `SELECT * FROM youtube_videos WHERE youtube_video_id = $1 LIMIT 1`;
            result = await DatabaseClient_1.db.query(query, [slug]);
            if (result.rows.length > 0) {
                const ytData = result.rows[0];
                const data = {
                    id: ytData.id,
                    title: ytData.title,
                    description: ytData.description,
                    youtube_video_id: ytData.youtube_video_id,
                    god_id: ytData.channel_name,
                    views: ytData.view_count,
                    duration: null,
                    is_string_duration: true,
                    string_duration: ytData.duration || "00:00",
                    published_date: ytData.published_at,
                    lyrics: ytData.description
                };
                return (0, apiResponse_1.sendSuccess)(res, 'Video retrieved', data);
            }
            return (0, apiResponse_1.sendSuccess)(res, 'Not found', null);
        }
        return (0, apiResponse_1.sendSuccess)(res, 'Bhajan retrieved', result.rows[0]);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
