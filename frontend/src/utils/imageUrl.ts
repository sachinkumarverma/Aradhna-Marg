/**
 * Return a smaller Supabase-rendered image when the source belongs to the
 * public storage API. Other URLs (including YouTube thumbnails) are left
 * unchanged so callers can use this helper without changing their data flow.
 */
export function getOptimizedImageUrl(source: string | null | undefined, width: number, quality = 75): string {
  if (!source) return '';

  try {
    const url = new URL(source);
    const match = url.pathname.match(/^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);

    if (!url.hostname.endsWith('.supabase.co') || !match) {
      return source;
    }

    // Images already compressed to WebP by the backend upload pipeline are served directly
    // to avoid the 2-3s on-the-fly transform penalty and concurrent worker throttling.
    if (url.pathname.endsWith('.webp')) {
      return source;
    }

    url.pathname = `/storage/v1/render/image/public/${match[1]}/${match[2]}`;
    url.searchParams.set('width', String(Math.max(1, Math.round(width))));
    url.searchParams.set('quality', String(Math.min(100, Math.max(1, Math.round(quality)))));
    url.searchParams.set('resize', 'contain');
    return url.toString();
  } catch {
    return source;
  }
}
