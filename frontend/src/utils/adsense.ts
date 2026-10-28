/**
 * Google AdSense Management & Validation Utilities
 */

export const PUBLISHER_ID_REGEX = /^ca-pub-\d{10,20}$/;
export const SLOT_ID_REGEX = /^\d{5,20}$/;

export function isValidPublisherId(id?: string | null): boolean {
  if (!id) return false;
  return PUBLISHER_ID_REGEX.test(id.trim());
}

export function isValidSlotId(id?: string | null): boolean {
  if (!id) return false;
  return SLOT_ID_REGEX.test(id.trim());
}

export function getConfiguredPublisherId(): string | null {
  const envId = (import.meta.env.VITE_ADSENSE_PUBLISHER_ID || import.meta.env.VITE_ADSENSE_CLIENT_ID || '').trim();

  if (isValidPublisherId(envId)) {
    return envId;
  }
  return null;
}

let isScriptLoading = false;

/**
 * Loads official Google AdSense library once and appends to document head.
 */
export function loadAdSenseScript(publisherId: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve();
    }

    if (!isValidPublisherId(publisherId)) {
      return resolve();
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="pagead2.googlesyndication.com"]');
    if (existingScript) {
      return resolve();
    }

    if (isScriptLoading) {
      return resolve();
    }

    isScriptLoading = true;
    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(publisherId)}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      isScriptLoading = false;
      resolve();
    };
    script.onerror = (e) => {
      console.warn('Failed to load Google AdSense script:', e);
      isScriptLoading = false;
      resolve();
    };

    document.head.appendChild(script);
  });
}

/**
 * Pages that MUST be strictly excluded from ad serving per Google AdSense policies.
 * Google prohibits ads on non-content, utility, legal, search, donation, or transaction pages.
 */
export const AD_EXCLUDED_PATH_PREFIXES = [
  '/support-us',
  '/donate',
  '/privacy',
  '/terms',
  '/disclaimer',
  '/contact',
  '/search',
  '/favourite',
  '/favorites',
  '/admin'
];

/**
 * Checks whether a given route/pathname should be excluded from ad serving.
 */
export function isAdExcludedPath(pathname: string): boolean {
  if (!pathname) return false;
  const normalized = pathname.toLowerCase().trim();
  return AD_EXCLUDED_PATH_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
}

/**
 * Dynamically pauses or resumes Google AdSense Auto Ads requests during SPA navigation.
 * Uses Google's official (adsbygoogle.pauseAdRequests = 1) mechanism for non-content pages.
 */
export function setAdSenseAutoAdsState(pathname: string): void {
  if (typeof window === 'undefined') return;
  const isExcluded = isAdExcludedPath(pathname);
  try {
    const w = window as any;
    w.adsbygoogle = w.adsbygoogle || [];
    if (isExcluded) {
      w.adsbygoogle.pauseAdRequests = 1;
    } else {
      w.adsbygoogle.pauseAdRequests = 0;
    }
  } catch {
    // Non-blocking if script is not yet initialized
  }
}
