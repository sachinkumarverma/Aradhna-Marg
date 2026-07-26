"use strict";
/**
 * Backend Global Constants
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_MESSAGES = exports.HTTP_STATUS = exports.CACHE_TTL = exports.PAGINATION = exports.STORAGE_PATHS = exports.APP_CONFIG = void 0;
exports.APP_CONFIG = {
    NAME: 'Aradhna Marg API',
    DEFAULT_PORT: 5000,
    API_PREFIX: '/api',
};
exports.STORAGE_PATHS = {
    PDFS: 'pdfs',
    IMAGES: 'images',
    TEMP: 'temp',
};
exports.PAGINATION = {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};
exports.CACHE_TTL = {
    BHAJANS: 3600, // 1 hour
    CATEGORIES: 86400, // 24 hours
    GODS: 86400,
    FESTIVALS: 86400,
};
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
};
exports.ERROR_MESSAGES = {
    VALIDATION_ERROR: 'Validation failed.',
    UNAUTHORIZED: 'You are not authorized to access this resource.',
    NOT_FOUND: 'The requested resource was not found.',
    INTERNAL_ERROR: 'An unexpected error occurred.',
};
