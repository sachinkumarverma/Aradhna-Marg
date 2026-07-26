"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.globalErrorHandler = void 0;
const appError_1 = require("../errors/appError");
const apiResponse_1 = require("../responses/apiResponse");
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
const globalErrorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    // Log error
    if (!error.isOperational) {
        logger_1.logger.error(`[UNHANDLED ERROR] ${err.message}`, { stack: err.stack, path: req.path });
    }
    else {
        logger_1.logger.warn(`[OPERATIONAL ERROR] ${err.message}`);
    }
    // Handle specific database or known library errors here if needed
    // ...
    // Operational, trusted error: send message to client
    if (err instanceof appError_1.AppError) {
        return (0, apiResponse_1.sendError)(res, err.message, err.errors, err.statusCode);
    }
    // Programming or other unknown error: don't leak error details in production
    const message = config_1.config.NODE_ENV === 'production' ? 'Something went wrong!' : err.message;
    return (0, apiResponse_1.sendError)(res, message, config_1.config.NODE_ENV === 'production' ? undefined : err.stack, 500);
};
exports.globalErrorHandler = globalErrorHandler;
// Catch-all for 404
const notFoundHandler = (req, res, next) => {
    next(new appError_1.AppError(`Route ${req.originalUrl} not found`, 404));
};
exports.notFoundHandler = notFoundHandler;
