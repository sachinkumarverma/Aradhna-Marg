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
