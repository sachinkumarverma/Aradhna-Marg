import { useMemo } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { isAdminHost } from '@utils/host';
import { standaloneAdminRoutes, prefixedAdminRoutes } from '@admin/routes';
import { userRoutes } from '@user/routes';

export function AppRouter() {
  const router = useMemo(() => {
    if (isAdminHost()) {
      // Standalone Admin Application (admin.aradhnamarg.com)
      return createBrowserRouter(standaloneAdminRoutes);
    }

    // Public / User Application (aradhnamarg.com, www.aradhnamarg.com, localhost)
    // Includes prefixed /admin routes for development & backward compatibility
    return createBrowserRouter([...userRoutes, ...prefixedAdminRoutes]);
  }, []);

  return <RouterProvider router={router} />;
}
