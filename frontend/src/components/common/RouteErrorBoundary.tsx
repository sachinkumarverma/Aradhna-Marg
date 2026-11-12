import React, { useEffect, useState } from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
import { RefreshCw, AlertTriangle, Home, LayoutDashboard } from 'lucide-react';
import { isAdminHost, getAdminPath } from '@utils/host';

export const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  const isAdmin = isAdminHost();
  const [isAutoReloading, setIsAutoReloading] = useState(false);

  useEffect(() => {
    console.error('[RouteErrorBoundary caught]:', error);
  }, [error]);

  const errorMessage =
    (error as any)?.message ||
    (error as any)?.statusText ||
    (typeof error === 'string' ? error : 'An unexpected error occurred while loading this page.');

  const isChunkError =
    errorMessage.includes('Failed to fetch dynamically imported module') ||
    errorMessage.includes('Importing a module script failed') ||
    errorMessage.includes('error loading dynamically imported module') ||
    errorMessage.includes('is not a valid JavaScript MIME type') ||
    errorMessage.includes('Expected a JavaScript') ||
    errorMessage.includes('MIME type of "text/html"') ||
    errorMessage.includes('Loading chunk') ||
    errorMessage.includes('dynamically imported module');

  useEffect(() => {
    if (isChunkError && typeof window !== 'undefined') {
      const reloadKey = 'am_error_boundary_reload';
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();

      // Automatically reload once if not attempted in the last 15 seconds
      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        setIsAutoReloading(true);
        sessionStorage.setItem(reloadKey, String(now));
        const timer = setTimeout(() => {
          window.location.reload();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isChunkError]);

  const handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (isAdmin) {
      navigate(getAdminPath('/dashboard'));
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md border border-orange-100 p-6 sm:p-8 text-center space-y-5">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-50 text-[#ff3b00] border border-orange-200">
          {isChunkError ? (
            <RefreshCw className={`w-7 h-7 ${isAutoReloading ? 'animate-spin' : ''}`} />
          ) : (
            <AlertTriangle className="w-7 h-7" />
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            {isChunkError
              ? isAutoReloading
                ? 'Updating to Latest Version...'
                : 'New Update Available'
              : 'Unable to Load Page'}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {isChunkError
              ? isAutoReloading
                ? 'A new version of Aradhna Marg has been deployed. Refreshing your page now...'
                : 'A newer version of this page is available. Please refresh to load the latest changes.'
              : 'We encountered an unexpected issue while rendering this section. Please try refreshing.'}
          </p>
          {Boolean(import.meta.env.DEV && error) && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-left overflow-auto max-h-48">
              <p className="text-xs font-mono font-bold text-red-700">{(error as any)?.message || String(error)}</p>
              {(error as any)?.stack && (
                <pre className="text-[10px] font-mono text-red-600 mt-2 whitespace-pre-wrap">
                  {(error as any).stack}
                </pre>
              )}
            </div>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleRefresh}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#ff3b00] hover:bg-[#e63500] text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Page</span>
          </button>

          <button
            onClick={handleGoHome}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors cursor-pointer"
          >
            {isAdmin ? <LayoutDashboard className="w-4 h-4" /> : <Home className="w-4 h-4" />}
            <span>{isAdmin ? 'Dashboard' : 'Home'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
