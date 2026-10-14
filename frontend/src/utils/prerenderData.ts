/**
 * Helper to retrieve embedded prerendered data from the static HTML DOM
 * Allows pages like Home, ArticleDetail, and BhajanDetail to render in 0ms
 * without stalling on Render backend cold starts or showing blank skeletons.
 */
export function getPrerenderedData<T = any>(): T | null {
  if (typeof document === 'undefined') return null;

  try {
    const script = document.getElementById('__PRERENDERED_DATA__');
    if (script?.textContent) {
      const data = JSON.parse(script.textContent);
      return data as T;
    }
  } catch (err) {
    console.warn('[PrerenderData] Failed to parse embedded payload:', err);
  }

  return null;
}
