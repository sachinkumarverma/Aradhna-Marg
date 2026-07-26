import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Abstracted Analytics Interface to support swapping providers without changing UI code
interface AnalyticsEvent {
  eventName: string;
  properties?: Record<string, any>;
}

export const useAnalytics = () => {
  const location = useLocation();

  // Automatic Page View tracking on route change
  useEffect(() => {
    // In production, this would call window.gtag('event', 'page_view', { page_path: location.pathname })
    console.debug('[Analytics] Page View:', location.pathname + location.search);
  }, [location]);

  const trackEvent = ({ eventName, properties }: AnalyticsEvent) => {
    // GA4 implementation mockup
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, properties);
    } else {
      console.debug(`[Analytics Event] ${eventName}`, properties);
    }
  };

  // Pre-configured core platform events
  const trackBhajanView = (bhajanId: string, title: string) => {
    trackEvent({ eventName: 'view_bhajan', properties: { bhajan_id: bhajanId, bhajan_title: title }});
  };

  const trackPDFDownload = (bhajanId: string, title: string) => {
    trackEvent({ eventName: 'download_pdf', properties: { bhajan_id: bhajanId, bhajan_title: title }});
  };

  const trackReadingModeToggle = (enabled: boolean) => {
    trackEvent({ eventName: 'toggle_reading_mode', properties: { enabled }});
  };

  const trackSearch = (query: string, resultsCount: number) => {
    trackEvent({ eventName: 'search', properties: { search_term: query, results_count: resultsCount }});
  };

  return {
    trackEvent,
    trackBhajanView,
    trackPDFDownload,
    trackReadingModeToggle,
    trackSearch
  };
};
