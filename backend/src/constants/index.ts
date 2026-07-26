/**
 * Backend Global Constants
 */

export const APP_CONFIG = {
  NAME: 'Aradhna Marg API',
  DEFAULT_PORT: 5000,
  API_PREFIX: '/api',
};

export const STORAGE_PATHS = {
  PDFS: 'pdfs',
  IMAGES: 'images',
  TEMP: 'temp',
};

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

export const CACHE_TTL = {
  BHAJANS: 3600, // 1 hour
  CATEGORIES: 86400, // 24 hours
  GODS: 86400,
  FESTIVALS: 86400,
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const ERROR_MESSAGES = {
  VALIDATION_ERROR: 'Validation failed.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  INTERNAL_ERROR: 'An unexpected error occurred.',
};
