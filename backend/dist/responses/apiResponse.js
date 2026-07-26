"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = exports.sendResponse = void 0;
const sendResponse = (res, statusCode, success, message, data, errors, meta) => {
    const response = {
        success,
        message,
        data,
        errors,
        meta,
        timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
};
exports.sendResponse = sendResponse;
const sendSuccess = (res, message, data, meta, statusCode = 200) => {
    return (0, exports.sendResponse)(res, statusCode, true, message, data, undefined, meta);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, errors, statusCode = 400) => {
    return (0, exports.sendResponse)(res, statusCode, false, message, undefined, errors);
};
exports.sendError = sendError;
