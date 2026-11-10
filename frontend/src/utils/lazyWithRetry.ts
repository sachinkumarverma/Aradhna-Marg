import React from 'react';

/**
 * Enhanced React.lazy wrapper that automatically catches dynamic chunk import failures
 * (typically caused by a new application deployment replacing old chunk hashes)
 * and safely triggers a page reload to fetch the latest production bundles.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    const routePath = typeof window !== 'undefined' ? window.location.pathname : '';
    const retryKey = `am_chunk_retry_${routePath}`;
    const alreadyRetried = typeof window !== 'undefined' ? sessionStorage.getItem(retryKey) : null;

    try {
      const module = await componentImport();
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(retryKey);
      }
      return module;
    } catch (error: any) {
      const errorMessage = error?.message || String(error || '');
      const isChunkError =
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('Importing a module script failed') ||
        errorMessage.includes('error loading dynamically imported module') ||
        errorMessage.includes('is not a valid JavaScript MIME type') ||
        errorMessage.includes('Expected a JavaScript') ||
        errorMessage.includes('MIME type of "text/html"') ||
        errorMessage.includes('Loading chunk') ||
        errorMessage.includes('dynamically imported module');

      if (isChunkError && typeof window !== 'undefined' && !alreadyRetried) {
        console.warn(`[App] Stale chunk detected for ${routePath}. Reloading latest assets...`);
        sessionStorage.setItem(retryKey, 'true');
        window.location.reload();
        // Return an unresolved promise so Suspense maintains its loading state while the page reloads
        return new Promise<{ default: T }>(() => {});
      }

      throw error;
    }
  });
}
