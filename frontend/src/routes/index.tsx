import { useEffect, useMemo } from 'react';
import { createBrowserRouter, RouterProvider, useLocation, type RouteObject } from 'react-router-dom';
import { isAdminHost, isLocalDev, getAdminSubdomainRedirectUrl } from '@utils/host';
import { standaloneAdminRoutes, prefixedAdminRoutes } from '@admin/routes';
import { userRoutes } from '@user/routes';

/**
 * Client-side redirect component for legacy /admin/* routes on the public production domain.
 * Seamlessly forwards traffic to the corresponding path on https://admin.aradhnamarg.com
 */
function LegacyAdminRedirect() {
  const location = useLocation();

  useEffect(() => {
    const redirectUrl = getAdminSubdomainRedirectUrl(location.pathname, location.search, location.hash);
    window.location.replace(redirectUrl);
  }, [location]);

  return null;
}

export function AppRouter() {
  const router = useMemo(() => {
    // 1. Standalone Admin Application (admin.aradhnamarg.com or VITE_APP_MODE=admin)
    if (isAdminHost()) {
      return createBrowserRouter(standaloneAdminRoutes);
    }

    // 2. Local Development Compatibility (localhost dual-app mode when VITE_APP_MODE is not set)
    if (isLocalDev()) {
      return createBrowserRouter([...userRoutes, ...prefixedAdminRoutes]);
    }

    // 3. Public Production Application (aradhnamarg.com or VITE_APP_MODE=public)
    // Mounts only user routes, and forwards any legacy /admin/* access to the dedicated Admin subdomain
    const publicProductionRoutes: RouteObject[] = [
      ...userRoutes,
      {
        path: '/admin',
        element: <LegacyAdminRedirect />
      },
      {
        path: '/admin/*',
        element: <LegacyAdminRedirect />
      }
    ];

    return createBrowserRouter(publicProductionRoutes);
  }, []);

  return <RouterProvider router={router} />;
}
