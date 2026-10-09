import { lazy } from 'react';
import { type RouteObject, Link } from 'react-router-dom';
import { AdminLayout } from '@admin/layouts/AdminLayout';
import { AdminDashboard } from '@admin/pages/dashboard';
import { AdminBhajans } from '@admin/pages/bhajans';
import { AdminBhajanForm } from '@admin/pages/bhajans/form';
import { AdminLogin } from '@admin/pages/login';
import { getAdminPath } from '@utils/host';

// Lazy loaded Admin pages
const AdminYoutube = lazy(() => import('@admin/pages/youtube').then((m) => ({ default: m.AdminYoutube })));
const AdminAI = lazy(() => import('@admin/pages/ai').then((m) => ({ default: m.AdminAI })));
const AdminCategories = lazy(() => import('@admin/pages/categories').then((m) => ({ default: m.AdminCategories })));
const AdminDeities = lazy(() => import('@admin/pages/deities').then((m) => ({ default: m.AdminDeities })));
const AdminFestivals = lazy(() => import('@admin/pages/festivals').then((m) => ({ default: m.AdminFestivals })));
const AdminFestivalForm = lazy(() =>
  import('@admin/pages/festivals/form').then((m) => ({ default: m.AdminFestivalForm }))
);
const AdminSEO = lazy(() => import('@admin/pages/seo').then((m) => ({ default: m.AdminSEO })));
const AdminSettings = lazy(() => import('@admin/pages/settings').then((m) => ({ default: m.AdminSettings })));
const AdminArticles = lazy(() => import('@admin/pages/articles').then((m) => ({ default: m.AdminArticles })));
const AdminArticleForm = lazy(() =>
  import('@admin/pages/articles/form').then((m) => ({ default: m.AdminArticleForm }))
);
const AdminPuranas = lazy(() => import('@admin/pages/puranas').then((m) => ({ default: m.AdminPuranas })));
const AdminPuranForm = lazy(() => import('@admin/pages/puranas/form').then((m) => ({ default: m.AdminPuranForm })));
const AdminAuthors = lazy(() => import('@admin/pages/authors').then((m) => ({ default: m.AdminAuthors })));
const AdminTags = lazy(() => import('@admin/pages/tags').then((m) => ({ default: m.AdminTags })));
const AdminAdvertisements = lazy(() =>
  import('@admin/pages/advertisements').then((m) => ({ default: m.AdminAdvertisements }))
);
const AdminSystemHealth = lazy(() =>
  import('@admin/pages/system-health').then((m) => ({ default: m.AdminSystemHealth }))
);

export const AdminNotFoundPage = () => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
    <h1 className="text-6xl font-black text-gray-300 mb-4">404</h1>
    <h2 className="text-2xl font-bold text-darkBrown mb-2">Admin Resource Not Found</h2>
    <p className="text-gray-500 mb-6">The dashboard panel you are looking for does not exist.</p>
    <Link
      to={getAdminPath('/dashboard')}
      className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-semibold transition-colors"
    >
      Back to Dashboard
    </Link>
  </div>
);

/**
 * Children routes inside AdminLayout
 */
const adminChildRoutes: RouteObject[] = [
  {
    index: true,
    element: <AdminDashboard />
  },
  {
    path: 'dashboard',
    element: <AdminDashboard />
  },
  {
    path: 'bhajans',
    element: <AdminBhajans />,
    children: [
      { path: 'new', element: <AdminBhajanForm /> },
      { path: ':id/edit', element: <AdminBhajanForm /> }
    ]
  },
  {
    path: 'articles',
    element: <AdminArticles />,
    children: [
      { path: 'new', element: <AdminArticleForm /> },
      { path: ':id/edit', element: <AdminArticleForm /> }
    ]
  },
  {
    path: 'puranas',
    element: <AdminPuranas />,
    children: [
      { path: 'new', element: <AdminPuranForm /> },
      { path: ':id/edit', element: <AdminPuranForm /> }
    ]
  },
  {
    path: 'festivals',
    element: <AdminFestivals />,
    children: [
      { path: 'new', element: <AdminFestivalForm /> },
      { path: ':id/edit', element: <AdminFestivalForm /> }
    ]
  },
  {
    path: 'categories',
    element: <AdminCategories />
  },
  {
    path: 'deities',
    element: <AdminDeities />
  },
  {
    path: 'authors',
    element: <AdminAuthors />
  },
  {
    path: 'tags',
    element: <AdminTags />
  },
  {
    path: 'youtube',
    element: <AdminYoutube />
  },
  {
    path: 'youtube-sync',
    element: <AdminYoutube />
  },
  {
    path: 'ai',
    element: <AdminAI />
  },
  {
    path: 'ai-processing',
    element: <AdminAI />
  },
  {
    path: 'seo',
    element: <AdminSEO />
  },
  {
    path: 'advertisements',
    element: <AdminAdvertisements />
  },
  {
    path: 'settings',
    element: <AdminSettings />
  },
  {
    path: 'system-health',
    element: <AdminSystemHealth />
  },
  {
    path: '*',
    element: <AdminNotFoundPage />
  }
];

/**
 * Route definitions when running on standalone admin host (e.g. admin.aradhnamarg.com)
 */
export const standaloneAdminRoutes: RouteObject[] = [
  {
    path: '/login',
    element: <AdminLogin />
  },
  {
    path: '/',
    element: <AdminLayout />,
    children: adminChildRoutes
  },
  // Backward compatibility on admin host if user enters /admin/...
  {
    path: '/admin/login',
    element: <AdminLogin />
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: adminChildRoutes
  }
];

/**
 * Route definitions when mounted under /admin (for dev / compatibility on public host)
 */
export const prefixedAdminRoutes: RouteObject[] = [
  {
    path: '/admin/login',
    element: <AdminLogin />
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: adminChildRoutes
  }
];
