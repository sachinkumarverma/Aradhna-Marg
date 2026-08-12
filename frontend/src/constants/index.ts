/**
 * Frontend Global Constants
 */

export const APP_NAME = 'Aradhna Marg';

export const API_ROUTES = {
  BHAJANS: '/bhajans',
  CATEGORIES: '/categories',
  FESTIVALS: '/festivals',
  GODS: '/gods',
  SEARCH: '/search'
};

export const ADMIN_ROUTES = {
  LOGIN: '/admin/login',
  DASHBOARD: '/admin/dashboard',
  SYNC_YOUTUBE: '/admin/youtube-sync',
  GENERATE_PDF: '/admin/generate-pdf'
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
};

export const DATE_FORMATS = {
  DISPLAY: 'DD MMM YYYY',
  FULL: 'DD MMM YYYY, hh:mm A'
};

export const THEME = {
  COLORS: {
    CREAM: '#FDFBF7',
    WHITE: '#FFFFFF',
    GOLDEN: '#DAA520',
    SAFFRON: '#FF9933',
    MAROON: '#800000',
    DARK_BROWN: '#3E2723'
  }
};

export const STORAGE_KEYS = {
  ADMIN_TOKEN: 'admin_token',
  THEME_PREFERENCE: 'theme_preference',
  RECENT_SEARCHES: 'recent_searches'
};
