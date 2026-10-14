import React, { useEffect } from 'react';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    clarity?: (...args: any[]) => void;
  }
}

export const AnalyticsTracker: React.FC = () => {
  const { settings } = usePublicSettings();
  const location = useLocation();

  // 1. Google Analytics Injection & Pageview tracking
  useEffect(() => {
    if (!settings.enableAnalytics || !settings.googleAnalyticsId) {
      return;
    }

    const gaId = settings.googleAnalyticsId.trim();
    if (!gaId) return;

    const scriptId = 'google-analytics-script';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.async = true;
      scriptEl.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(scriptEl);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer?.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', gaId, { send_page_view: false });
    }

    // Trigger page_view on route change
    if (typeof window.gtag === 'function') {
      window.gtag('config', gaId, {
        page_path: location.pathname + location.search
      });
    }
  }, [settings.enableAnalytics, settings.googleAnalyticsId, location.pathname, location.search]);

  // 2. Microsoft Clarity Injection
  useEffect(() => {
    if (!settings.enableAnalytics || !settings.microsoftClarity) {
      return;
    }

    const clarityId = settings.microsoftClarity.trim();
    if (!clarityId) return;

    const scriptId = 'microsoft-clarity-script';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.async = true;
      scriptEl.innerHTML = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${clarityId}");`;
      document.head.appendChild(scriptEl);
    }
  }, [settings.enableAnalytics, settings.microsoftClarity]);

  return null;
};
