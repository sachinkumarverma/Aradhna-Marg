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
