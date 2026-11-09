import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './routes';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from './i18n/LanguageContext';
import { UserAuthProvider } from './context/UserAuthContext';
import { SEOProvider } from './providers/SEOProvider';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000
    }
  }
});

function App() {
  const [isMobile, setIsMobile] = React.useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [loadTelemetry, setLoadTelemetry] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined' || ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)) return;

    const load = () => setLoadTelemetry(true);
    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(load, { timeout: 3000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = setTimeout(load, 2500);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <SEOProvider>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <UserAuthProvider>
            <React.Suspense
              fallback={<div className="min-h-screen flex items-center justify-center bg-[#F9F7F3]" aria-busy="true" />}
            >
              <AppRouter />
            </React.Suspense>
            <Toaster
              position={isMobile ? 'bottom-center' : 'top-right'}
              containerStyle={isMobile ? { bottom: 24, zIndex: 99999 } : { zIndex: 99999 }}
              toastOptions={{
                className: '!rounded-md !shadow-lg',
                style: {
                  borderRadius: '6px',
                  fontSize: '14px',
                  maxWidth: '92vw'
                }
              }}
            />
            {loadTelemetry && <Analytics />}
            {loadTelemetry && <SpeedInsights />}
          </UserAuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </SEOProvider>
  );
}

export default App;
