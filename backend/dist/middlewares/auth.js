"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
const appError_1 = require("../errors/appError");
const logger_1 = require("../utils/logger");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const requireAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new appError_1.UnauthorizedError('Missing or invalid authorization token');
        }
        const token = authHeader.split(' ')[1];
        // Verify token using our own JWT_SECRET
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, config_1.config.JWT_SECRET);
        }
        catch (jwtError) {
            throw new appError_1.UnauthorizedError('Invalid or expired token');
        }
        if (!decoded) {
            throw new appError_1.UnauthorizedError('Invalid or expired token');
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        logger_1.logger.warn({ error }, 'Admin access denied');
        next(error);
    }
};
exports.requireAdmin = requireAdmin;
