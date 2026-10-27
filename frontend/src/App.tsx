import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './routes';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from './i18n/LanguageContext';
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

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <SEOProvider>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AppRouter />
          <Toaster
            position={isMobile ? 'bottom-center' : 'top-right'}
            containerStyle={isMobile ? { bottom: 24, zIndex: 99999 } : { zIndex: 99999 }}
            toastOptions={{
              className: '!rounded-xl !shadow-lg',
              style: {
                fontSize: '14px',
                maxWidth: '92vw'
              }
            }}
          />
          <Analytics />
          <SpeedInsights />
        </LanguageProvider>
      </QueryClientProvider>
    </SEOProvider>
  );
}

export default App;
