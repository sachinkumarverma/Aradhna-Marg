"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const security_1 = require("./config/security");
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const uuid_1 = require("uuid");
const routes_1 = __importDefault(require("./routes"));
const seo_routes_1 = __importDefault(require("./seo/routes/seo.routes"));
const error_1 = require("./middlewares/error");
const logger_1 = require("./utils/logger");
const app = (0, express_1.default)();
// Add Request ID generator middleware
app.use((req, res, next) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || (0, uuid_1.v4)();
    res.setHeader('x-request-id', req.headers['x-request-id']);
    next();
});
// Security & Standard Middlewares
app.use(security_1.securityMiddleware);
app.use((0, cors_1.default)());
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
// Logging Middleware
app.use((0, morgan_1.default)((tokens, req, res) => {
    return [
        `[${tokens.date(req, res, 'iso')}]`,
        tokens['remote-addr'](req, res),
        `ID:${req.headers['x-request-id']}`,
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        `${tokens['response-time'](req, res)}ms`,
    ].join(' ');
}, {
    stream: {
        write: (message) => logger_1.logger.info(message.trim()),
    },
}));
// Public SEO Files (robots.txt, sitemap.xml)
app.use('/', seo_routes_1.default);
// API Routes Entry Point
app.use('/api', routes_1.default);
// 404 Handler for undefined routes
app.use(error_1.notFoundHandler);
// Global Error Handler
app.use(error_1.globalErrorHandler);
exports.default = app;
