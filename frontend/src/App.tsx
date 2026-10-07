import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './routes';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from './i18n/LanguageContext';
import { SEOProvider } from './providers/SEOProvider';
import { Analytics } from '@vercel/analytics/react';

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
  return (
    <SEOProvider>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AppRouter />
          <Toaster position="top-right" />
          <Analytics />
        </LanguageProvider>
      </QueryClientProvider>
    </SEOProvider>
  );
}

export default App;
