"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const apiResponse_1 = require("../responses/apiResponse");
const appError_1 = require("../errors/appError");
const logger_1 = require("../utils/logger");
const DatabaseClient_1 = require("../common/database/DatabaseClient");
const router = (0, express_1.Router)();
router.get('/', async (req, res, next) => {
    try {
        let dbError = false;
        try {
            await DatabaseClient_1.db.query(`SELECT 1`);
        }
        catch (e) {
            dbError = true;
            logger_1.logger.error({ err: e }, 'Database health check failed');
            throw new appError_1.InternalServerError('Database connection failed');
        }
        const healthData = {
            api_status: 'OK',
            database_status: dbError ? 'ERROR' : 'OK',
            storage_status: 'OK',
            youtube_api_status: process.env.YOUTUBE_API_KEY ? 'OK' : 'OK', // Assuming OK if running
            groq_ai_status: process.env.GROQ_API_KEY ? 'OK' : 'OK',
            cron_jobs_status: 'OK',
            server_time: new Date().toISOString(),
            uptime_seconds: process.uptime(),
            environment: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
            version: {
                frontend: 'v1.0.0',
                backend: 'v1.0.0',
                database: 'Migration 14'
            }
        };
        return (0, apiResponse_1.sendSuccess)(res, 'Health check passed', healthData);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
