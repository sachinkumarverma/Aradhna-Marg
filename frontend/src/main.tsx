import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Remove static pre-rendered head metadata before React mounts so SEOHead is the single authoritative source
if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-prerender="true"], [data-rh="true"]').forEach((el) => {
    if (el.tagName !== 'BODY' && el.tagName !== 'HTML') {
      el.remove();
    }
  });
}

// Auto-recover from stale chunks when a new application deployment occurs
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('[App] Stale chunk detected after deployment, auto-refreshing...', event);
    const RELOAD_KEY = 'am_stale_chunk_reload';
    const lastReload = sessionStorage.getItem(RELOAD_KEY);
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem(RELOAD_KEY, String(now));
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register Service Worker for PWA installation (Desktop & Mobile)
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.debug('SW registration error:', err));
  });
}
