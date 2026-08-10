"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const apiResponse_1 = require("@/responses/apiResponse");
const appError_1 = require("@/errors/appError");
const config_1 = require("@/config");
const logger_1 = require("@utils/logger");
class AuthController {
    /**
     * POST /api/auth/login
     * Validates username/password from env and returns a signed JWT.
     */
    login = async (req, res, next) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                throw new appError_1.UnauthorizedError('Username and password are required');
            }
            // Compare against env-configured admin credentials
            if (username !== config_1.config.ADMIN_USERNAME || password !== config_1.config.ADMIN_PASSWORD) {
                throw new appError_1.UnauthorizedError('Invalid credentials');
            }
            // Sign a JWT valid for 24 hours
            const token = jsonwebtoken_1.default.sign({ username, role: 'admin' }, config_1.config.JWT_SECRET, { expiresIn: '24h' });
            logger_1.logger.info(`Admin login successful for user: ${username}`);
            return (0, apiResponse_1.sendSuccess)(res, 'Login successful', {
                token,
                user: { username, role: 'admin' },
                expiresIn: '24h',
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * POST /api/auth/logout
     * Stateless JWT logout — client simply drops the token.
     */
    logout = async (_req, res, next) => {
        try {
            return (0, apiResponse_1.sendSuccess)(res, 'Logged out successfully', {});
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * GET /api/auth/me
     * Returns decoded user info from the JWT attached by requireAdmin middleware.
     */
    me = async (req, res, next) => {
        try {
            return (0, apiResponse_1.sendSuccess)(res, 'User info', { user: req.user });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.authController = new AuthController();
