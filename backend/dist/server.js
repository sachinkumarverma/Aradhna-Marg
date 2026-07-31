"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const PORT = parseInt(config_1.config.PORT, 10);
const server = app_1.default.listen(PORT, () => {
    logger_1.logger.info(`🚀 Server is running on http://localhost:${PORT} in ${config_1.config.NODE_ENV} mode.`);
});
// Graceful Shutdown
const gracefulShutdown = () => {
    logger_1.logger.info('Received shutdown signal. Closing HTTP server...');
    server.close(() => {
        logger_1.logger.info('HTTP server closed. Process will exit now.');
        process.exit(0);
    });
    // Force close after 10 seconds
    setTimeout(() => {
        logger_1.logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
// Handle uncaught exceptions and rejections
process.on('uncaughtException', (err) => {
    console.error('RAW UNCAUGHT EXCEPTION:', err);
    logger_1.logger.error({ err }, 'Uncaught Exception');
    gracefulShutdown();
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('RAW UNHANDLED REJECTION:', reason);
    logger_1.logger.error({ reason }, 'Unhandled Rejection at promise');
    gracefulShutdown();
});
