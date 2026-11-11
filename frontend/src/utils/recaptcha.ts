declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

let recaptchaScriptPromise: Promise<void> | null = null;

const getSiteKey = (): string => import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

const loadRecaptchaScript = (siteKey: string): Promise<void> => {
  if (typeof window === 'undefined') return Promise.reject(new Error('CAPTCHA requires a browser.'));
  if (window.grecaptcha) return Promise.resolve();
  if (recaptchaScriptPromise) return recaptchaScriptPromise;

  recaptchaScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src^="https://www.google.com/recaptcha/api.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('CAPTCHA failed to load.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('CAPTCHA failed to load.'));
    document.head.appendChild(script);
  });

  return recaptchaScriptPromise;
};

export const getRecaptchaToken = async (action: string): Promise<string> => {
  const siteKey = getSiteKey();
  if (!siteKey) {
    throw new Error('Additional verification is not configured in this browser.');
  }

  await loadRecaptchaScript(siteKey);

  if (!window.grecaptcha) {
    throw new Error('Additional verification is unavailable. Please try again.');
  }

  await new Promise<void>((resolve) => window.grecaptcha?.ready(resolve));
  const token = await window.grecaptcha.execute(siteKey, { action });

  if (!token) throw new Error('Additional verification failed. Please try again.');
  return token;
};
