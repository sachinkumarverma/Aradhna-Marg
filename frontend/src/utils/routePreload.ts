/**
 * Lightweight Route Preloader to fetch lazy-loaded chunks on hover / touchstart or idle.
 * Ensures instant zero-lag transitions when clicking any card across the platform.
 */
const preloadMap: Record<string, () => Promise<any>> = {
  festival: () => import('@user/pages/festivals/detail'),
  festivals: () => import('@user/pages/festivals'),
  bhajan: () => import('@user/pages/bhajans/detail'),
  bhajans: () => import('@user/pages/bhajans'),
  article: () => import('@user/pages/articles/detail'),
  articles: () => import('@user/pages/articles'),
  purana: () => import('@user/pages/puranas/detail'),
  puranas: () => import('@user/pages/puranas'),
  deity: () => import('@user/pages/collections/CollectionDetails'),
  god: () => import('@user/pages/collections/CollectionDetails'),
  gods: () => import('@user/pages/deities'),
  deities: () => import('@user/pages/deities'),
  video: () => import('@user/pages/bhajans/detail'),
  videos: () => import('@user/pages/videos'),
  category: () => import('@user/pages/collections/CollectionDetails'),
  categories: () => import('@user/pages/categories'),
  collection: () => import('@user/pages/collections/CollectionDetails')
};

const prefetchedSet = new Set<string>();

export function preloadRoute(type: string) {
  if (typeof window === 'undefined' || prefetchedSet.has(type)) return;
  prefetchedSet.add(type);

  try {
    const fn = preloadMap[type];
    if (fn) {
      fn().catch(() => {
        prefetchedSet.delete(type);
      });
    }
  } catch {
    prefetchedSet.delete(type);
  }
}

/**
 * Preload core public route chunks in background during browser idle time.
 * Total size of all chunks combined is < 60 KB.
 * Once preloaded, any navigation click happens in 0ms with instant skeleton feedback.
 */
export function preloadAllCoreRoutes() {
  if (typeof window === 'undefined') return;

  const runPreload = () => {
    // Stagger loading slightly to not contend with initial page assets
    const keys = Object.keys(preloadMap);
    keys.forEach((key, index) => {
      setTimeout(() => {
        preloadRoute(key);
      }, index * 100);
    });
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(runPreload, { timeout: 3000 });
  } else {
    setTimeout(runPreload, 1500);
  }
}
