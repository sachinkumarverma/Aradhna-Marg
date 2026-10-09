/**
 * Hostname and Application Mode Detection Utilities
 *
 * Provides centralized host and environment-based application detection for separating
 * the Public website (aradhnamarg.com) and the Admin application (admin.aradhnamarg.com).
 */

export function getHostname(): string {
  if (typeof window === 'undefined') return '';
  return window.location.hostname.toLowerCase();
}

/**
 * Returns explicit mode if configured via VITE_APP_MODE ('admin' | 'public'), or undefined.
 */
export function getEnvAppMode(): 'admin' | 'public' | undefined {
  const envMode = import.meta.env.VITE_APP_MODE;
  if (typeof envMode === 'string') {
    const normalized = envMode.trim().toLowerCase();
    if (normalized === 'admin' || normalized === 'public') {
      return normalized;
    }
  }
  return undefined;
}

/**
 * Determines whether the current environment is localhost / local development.
 */
export function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = getHostname();
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local')
  );
}

/**
 * Determines whether local development dual-mode (/ and /admin on same port) should be active.
 * Active only in local dev when VITE_APP_MODE is not explicitly set.
 */
export function isLocalDev(): boolean {
  const envMode = getEnvAppMode();
  if (envMode === 'admin' || envMode === 'public') {
    return false;
  }
  return isLocalhost();
}

/**
 * Determines whether the current hostname / environment corresponds to the Admin application.
 *
 * Precedence:
 * 1. Environment variable VITE_APP_MODE:
 *    - 'admin'  -> true (Standalone Admin app)
 *    - 'public' -> false (Public app)
 * 2. Hostname & URL rules (fallback when VITE_APP_MODE is not set):
 *    - Production Admin domain: admin.aradhnamarg.com
 *    - Subdomains: admin.* (e.g., admin.localhost, admin.local, admin-preview.vercel.app)
 *    - Development/testing URL parameter override: ?app=admin or ?mode=admin
 */
export function isAdminHost(): boolean {
  // 1. Explicit environment variable mode takes precedence
  const envMode = getEnvAppMode();
  if (envMode === 'admin') {
    return true;
  }
  if (envMode === 'public') {
    return false;
  }

  // 2. Fall back to hostname / URL detection in browser
  if (typeof window === 'undefined') return false;

  const hostname = getHostname();

  // Production admin domain
  if (hostname === 'admin.aradhnamarg.com') {
    return true;
  }

  // Staging / preview / local subdomains (e.g. admin.localhost, admin-preview.vercel.app)
  if (hostname.startsWith('admin.') || hostname.startsWith('admin-')) {
    return true;
  }

  // Optional URL query override for local testing without modifying hosts file
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const appParam = urlParams.get('app') || urlParams.get('mode');
    if (appParam === 'admin') {
      return true;
    }
  } catch {
    // Ignore URL parsing errors
  }

  return false;
}

/**
 * Determines whether the current hostname corresponds to the Public/User application.
 */
export function isPublicHost(): boolean {
  return !isAdminHost();
}

export type AppMode = 'ADMIN' | 'USER';

/**
 * Returns current application mode ('ADMIN' or 'USER').
 */
export function getAppMode(): AppMode {
  return isAdminHost() ? 'ADMIN' : 'USER';
}

/**
 * Computes an admin path or URL appropriate for the current host environment.
 *
 * In standalone Admin mode (admin.aradhnamarg.com or VITE_APP_MODE=admin):
 *   getAdminPath('/bhajans') -> '/bhajans'
 *   getAdminPath('/login')   -> '/login'
 *   getAdminPath('')         -> '/dashboard'
 *   getAdminPath('/')        -> '/dashboard'
 *
 * In Localhost dev mode (dual-app on localhost):
 *   getAdminPath('/bhajans') -> '/admin/bhajans'
 *   getAdminPath('/login')   -> '/admin/login'
 *   getAdminPath('')         -> '/admin'
 *   getAdminPath('/')        -> '/admin'
 *
 * In Public production mode (aradhnamarg.com):
 *   getAdminPath('/bhajans') -> 'https://admin.aradhnamarg.com/bhajans'
 *   getAdminPath('/login')   -> 'https://admin.aradhnamarg.com/login'
 *   getAdminPath('')         -> 'https://admin.aradhnamarg.com/'
 */
export function getAdminPath(path = ''): string {
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';

  if (isAdminHost()) {
    if (!cleanPath || cleanPath === '/' || cleanPath === '/dashboard') {
      return '/dashboard';
    }
    return cleanPath;
  }

  if (isLocalDev()) {
    if (!cleanPath || cleanPath === '/') {
      return '/admin';
    }
    return `/admin${cleanPath}`;
  }

  // Public Production: Link to standalone Admin subdomain
  const targetSubPath = !cleanPath || cleanPath === '/' ? '' : cleanPath;
  return `https://admin.aradhnamarg.com${targetSubPath}`;
}

/**
 * Computes the Admin subdomain redirect target from a legacy /admin/* path.
 *
 * Examples:
 *   /admin             -> https://admin.aradhnamarg.com/
 *   /admin/login       -> https://admin.aradhnamarg.com/login
 *   /admin/dashboard   -> https://admin.aradhnamarg.com/dashboard
 *   /admin/bhajans?q=1 -> https://admin.aradhnamarg.com/bhajans?q=1
 */
export function getAdminSubdomainRedirectUrl(pathname = '', search = '', hash = ''): string {
  const cleanPath = pathname.replace(/^\/admin/, '') || '/';
  const query = search || '';
  const fragment = hash || '';
  return `https://admin.aradhnamarg.com${cleanPath}${query}${fragment}`;
}

/**
 * Returns the public website URL for linking back to main user site.
 */
export function getPublicHomeUrl(): string {
  if (typeof window === 'undefined') return '/';

  if (isAdminHost()) {
    // If in local dev with admin mode
    if (isLocalhost()) {
      const port = window.location.port ? `:${window.location.port}` : '';
      return `${window.location.protocol}//localhost${port}/`;
    }
    // Production admin domain links back to public production domain
    return 'https://aradhnamarg.com/';
  }

  return '/';
}
