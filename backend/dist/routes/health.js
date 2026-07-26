"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const apiResponse_1 = require("../responses/apiResponse");
const supabase_1 = require("../database/supabase");
const appError_1 = require("../errors/appError");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.get('/', async (req, res, next) => {
    try {
        // Check Database connection by fetching server version or a simple ping
        const { error: dbError } = await supabase_1.supabase.from('settings').select('id').limit(1);
        if (dbError) {
            logger_1.logger.error('Database health check failed:', dbError);
            throw new appError_1.InternalServerError('Database connection failed');
        }
        const healthData = {
            api_status: 'OK',
            database_status: 'OK',
            server_time: new Date().toISOString(),
            uptime_seconds: process.uptime(),
            version: '1.0.0',
        };
        return (0, apiResponse_1.sendSuccess)(res, 'Health check passed', healthData);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
