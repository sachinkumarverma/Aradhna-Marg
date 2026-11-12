/**
 * Lightweight Route Preloader to fetch lazy-loaded chunks on hover / touchstart.
 * Ensures instant zero-lag transitions when clicking any card across the platform.
 */
const preloadMap: Record<string, () => Promise<any>> = {
  festival: () => import('@user/pages/festivals/detail'),
  bhajan: () => import('@user/pages/bhajans/detail'),
  article: () => import('@user/pages/articles/detail'),
  purana: () => import('@user/pages/puranas/detail'),
  deity: () => import('@user/pages/deities'),
  god: () => import('@user/pages/deities'),
  video: () => import('@user/pages/videos'),
  category: () => import('@user/pages/categories')
};

const prefetchedSet = new Set<string>();

export function preloadRoute(
  type: 'festival' | 'bhajan' | 'article' | 'purana' | 'deity' | 'god' | 'video' | 'category'
) {
  if (typeof window === 'undefined' || prefetchedSet.has(type)) return;
  prefetchedSet.add(type);

  try {
    const fn = preloadMap[type];
    if (fn) {
      fn().catch(() => {
        // Clear from set on failure so retry is possible
        prefetchedSet.delete(type);
      });
    }
  } catch (err) {
    prefetchedSet.delete(type);
  }
}
