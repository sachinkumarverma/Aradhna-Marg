/**
 * Threshold in seconds for defining a YouTube Short.
 * Videos with duration <= 180 seconds (3 minutes) or with #shorts in title/desc/url are considered Shorts.
 */
export const MAX_SHORT_DURATION_SECONDS = 180;

/**
 * Parses duration string (ISO 8601 e.g. PT1M30S, 'Xh Ym Zs', 'MM:SS', or pure seconds) into total seconds.
 */
export const parseDurationInSeconds = (durationStr?: string): number => {
  if (!durationStr) return 0;
  const str = durationStr.toLowerCase().trim();
  if (!str) return 0;

  let secs = 0;
  const isoH = str.match(/(\d+)h/);
  const isoM = str.match(/(\d+)m/);
  const isoS = str.match(/(\d+)s/);

  if (isoH || isoM || isoS) {
    if (isoH) secs += parseInt(isoH[1], 10) * 3600;
    if (isoM) secs += parseInt(isoM[1], 10) * 60;
    if (isoS) secs += parseInt(isoS[1], 10);
  } else if (str.includes(':')) {
    const parts = str.split(':').map((p: string) => parseInt(p, 10) || 0);
    if (parts.length === 3) secs = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else if (parts.length === 2) secs = parts[0] * 60 + parts[1];
  } else {
    const num = parseInt(str, 10);
    if (!isNaN(num)) secs = num;
  }

  return secs;
};

/**
 * Determines whether a video object represents a YouTube Short.
 */
export const isShortVideo = (video: {
  title?: string;
  description?: string;
  youtube_url?: string;
  duration?: string;
}): boolean => {
  if (!video) return false;
  const title = (video.title || '').toLowerCase();
  const desc = (video.description || '').toLowerCase();
  const url = (video.youtube_url || '').toLowerCase();

  if (title.includes('#shorts') || title.includes('#short') || desc.includes('#shorts') || url.includes('/shorts/')) {
    return true;
  }

  const secs = parseDurationInSeconds(video.duration);
  return secs > 0 && secs <= MAX_SHORT_DURATION_SECONDS;
};
