/**
 * Hostname and Application Mode Detection Utilities
 *
 * Provides centralized host-based application detection for separating
 * the Public/User application (aradhnamarg.com) and Admin application (admin.aradhnamarg.com).
 */

export function getHostname(): string {
  if (typeof window === 'undefined') return '';
  return window.location.hostname.toLowerCase();
}

/**
 * Determines whether the current hostname corresponds to the Admin application.
 *
 * Recognized Admin hosts:
 * - Production: admin.aradhnamarg.com
 * - Subdomains: admin.* (e.g., admin.localhost, admin.local, admin.example.com)
 * - Development/testing override: URL parameter ?app=admin or ?mode=admin
 */
export function isAdminHost(): boolean {
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
 * Computes an admin path appropriate for the current host environment.
 *
 * In standalone Admin mode (admin.aradhnamarg.com):
 *   getAdminPath('/bhajans') -> '/bhajans'
 *   getAdminPath('/login')   -> '/login'
 *   getAdminPath('')         -> '/dashboard'
 *   getAdminPath('/')        -> '/dashboard'
 *
 * In Public/Dev mode (e.g. localhost fallback with /admin prefix):
 *   getAdminPath('/bhajans') -> '/admin/bhajans'
 *   getAdminPath('/login')   -> '/admin/login'
 *   getAdminPath('')         -> '/admin'
 *   getAdminPath('/')        -> '/admin'
 */
export function getAdminPath(path = ''): string {
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';

  if (isAdminHost()) {
    if (!cleanPath || cleanPath === '/' || cleanPath === '/dashboard') {
      return '/dashboard';
    }
    return cleanPath;
  }

  // When running under /admin prefix (dev / compatibility)
  if (!cleanPath || cleanPath === '/') {
    return '/admin';
  }
  return `/admin${cleanPath}`;
}

/**
 * Returns the public website URL for linking back to main user site.
 */
export function getPublicHomeUrl(): string {
  if (typeof window === 'undefined') return '/';

  if (isAdminHost()) {
    // If in production on admin.aradhnamarg.com, point to public production domain
    if (window.location.hostname === 'admin.aradhnamarg.com') {
      return 'https://aradhnamarg.com/';
    }
    // If in local dev with admin subdomain (e.g. admin.localhost:5173), point to root localhost
    const port = window.location.port ? `:${window.location.port}` : '';
    const protocol = window.location.protocol;
    const baseHost = window.location.hostname.replace(/^admin\./, '');
    return `${protocol}//${baseHost}${port}/`;
  }

  return '/';
}
