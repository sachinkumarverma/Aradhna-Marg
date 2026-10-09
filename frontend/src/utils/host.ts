/**
 * Hostname and Application Mode Detection Utilities
 *
 * Provides centralized host and environment-based application detection for separating
 * the Public website (aradhnamarg.com / aradhna-marg.vercel.app) and the
 * Admin application (admin.aradhnamarg.com / aradhna-marg-admin.vercel.app).
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
 *    - Vercel Admin deployment: aradhna-marg-admin.vercel.app
 *    - Subdomains: admin.* or *-admin.* (e.g., admin.localhost, admin.local, admin-preview.vercel.app)
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

  // Staging / preview / vercel / local subdomains
  if (
    hostname.startsWith('admin.') ||
    hostname.startsWith('admin-') ||
    hostname.includes('-admin.') ||
    hostname.endsWith('-admin.vercel.app')
  ) {
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
 * Determines the target Admin base origin corresponding to the current host.
 *
 * Examples:
 *   aradhna-marg.vercel.app -> https://aradhna-marg-admin.vercel.app
 *   aradhnamarg.com         -> https://admin.aradhnamarg.com
 */
export function getAdminOrigin(): string {
  if (typeof window === 'undefined') {
    return 'https://admin.aradhnamarg.com';
  }

  const hostname = getHostname();

  // Vercel deployment: route to equivalent Admin Vercel domain
  if (hostname.endsWith('.vercel.app')) {
    if (hostname === 'aradhna-marg.vercel.app') {
      return 'https://aradhna-marg-admin.vercel.app';
    }
    if (!hostname.includes('admin')) {
      const adminVercelHost = hostname.replace('aradhna-marg', 'aradhna-marg-admin');
      if (adminVercelHost !== hostname) {
        return `https://${adminVercelHost}`;
      }
      return 'https://aradhna-marg-admin.vercel.app';
    }
  }

  // Production custom domain
  return 'https://admin.aradhnamarg.com';
}

/**
 * Computes an admin path or URL appropriate for the current host environment.
 *
 * In standalone Admin mode (admin.aradhnamarg.com / aradhna-marg-admin.vercel.app / VITE_APP_MODE=admin):
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
 * In Public production mode (aradhnamarg.com / aradhna-marg.vercel.app):
 *   getAdminPath('/bhajans') -> '<adminOrigin>/bhajans'
 *   getAdminPath('/login')   -> '<adminOrigin>/login'
 *   getAdminPath('')         -> '<adminOrigin>/'
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

  // Public Production / Public Vercel: Link to respective standalone Admin origin
  const adminOrigin = getAdminOrigin();
  const targetSubPath = !cleanPath || cleanPath === '/' ? '' : cleanPath;
  return `${adminOrigin}${targetSubPath}`;
}

/**
 * Computes the Admin subdomain redirect target from a legacy /admin/* path.
 *
 * Examples:
 *   PUBLIC VERCEL:
 *     https://aradhna-marg.vercel.app/admin           -> https://aradhna-marg-admin.vercel.app/login
 *     https://aradhna-marg.vercel.app/admin/login     -> https://aradhna-marg-admin.vercel.app/login
 *     https://aradhna-marg.vercel.app/admin/dashboard -> https://aradhna-marg-admin.vercel.app/dashboard
 *     https://aradhna-marg.vercel.app/admin/bhajans   -> https://aradhna-marg-admin.vercel.app/bhajans
 *
 *   PUBLIC PRODUCTION:
 *     https://aradhnamarg.com/admin           -> https://admin.aradhnamarg.com/login
 *     https://aradhnamarg.com/admin/login     -> https://admin.aradhnamarg.com/login
 *     https://aradhnamarg.com/admin/dashboard -> https://admin.aradhnamarg.com/dashboard
 *     https://aradhnamarg.com/admin/bhajans   -> https://admin.aradhnamarg.com/bhajans
 */
export function getAdminSubdomainRedirectUrl(pathname = '', search = '', hash = ''): string {
  const adminOrigin = getAdminOrigin();
  const rawSubPath = pathname.replace(/^\/admin/, '');
  const cleanSubPath = rawSubPath === '' || rawSubPath === '/' ? '/login' : rawSubPath;
  const query = search || '';
  const fragment = hash || '';
  return `${adminOrigin}${cleanSubPath}${query}${fragment}`;
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
    // If on admin vercel (e.g. aradhna-marg-admin.vercel.app), point back to public vercel
    const hostname = getHostname();
    if (hostname.endsWith('.vercel.app')) {
      return 'https://aradhna-marg.vercel.app/';
    }
    // Production admin domain links back to public production domain
    return 'https://aradhnamarg.com/';
  }

  return '/';
}
