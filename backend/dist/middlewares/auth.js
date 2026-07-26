"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
const appError_1 = require("../errors/appError");
const supabase_1 = require("../database/supabase");
const logger_1 = require("../utils/logger");
const requireAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new appError_1.UnauthorizedError('Missing or invalid authorization token');
        }
        const token = authHeader.split(' ')[1];
        // Verify token with Supabase Auth
        const { data: { user }, error } = await supabase_1.supabase.auth.getUser(token);
        if (error || !user) {
            throw new appError_1.UnauthorizedError('Invalid or expired token');
        }
        // In a single-admin system, you can verify the email or a role claim
        // For this architecture, we assume any valid user in this Supabase project is the admin
        // as registrations are disabled globally.
        req.user = user;
        next();
    }
    catch (error) {
        logger_1.logger.warn('Admin access denied', error);
        next(error);
    }
};
exports.requireAdmin = requireAdmin;
