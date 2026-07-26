import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { Home } from '../pages/home';
import { BhajanDetail } from '../pages/bhajans/detail';
import { SearchPage } from '../pages/search';
import { ExplorePage } from '../pages/explore';
import { CollectionDetails } from '../pages/collections/CollectionDetails';
import { AdminLayout } from '../layouts/admin/AdminLayout';
import { AdminDashboard } from '../pages/admin/dashboard';
import { AdminBhajans } from '../pages/admin/bhajans';

import { VideosList } from '../pages/videos';
import { AdminLogin } from '../pages/admin/login';

// Reusable beautifully styled Coming Soon component
const ComingSoon = ({ title }: { title: string }) => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 pt-24">
    <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
      <span className="text-4xl">🚧</span>
    </div>
    <h1 className="text-3xl md:text-4xl font-extrabold text-darkBrown tracking-tight mb-4">
      {title.split(' ')[0]} <span className="text-saffron">{title.split(' ').slice(1).join(' ')}</span>
    </h1>
    <p className="text-darkBrown/60 text-lg max-w-md mx-auto">
      We are actively working on building this spiritual directory. Please check back soon!
    </p>
  </div>
);

// Lazy loaded placeholders for future pages (Public)
const BhajansList = lazy(() => Promise.resolve({ default: () => <ComingSoon title="Bhajans Directory" /> }));
const Categories = lazy(() => Promise.resolve({ default: () => <ComingSoon title="Categories Directory" /> }));
const Gods = lazy(() => Promise.resolve({ default: () => <ComingSoon title="Deities Directory" /> }));
const Festivals = lazy(() => Promise.resolve({ default: () => <ComingSoon title="Festivals Directory" /> }));

// Lazy loaded placeholders for future pages (Admin)
const AdminYoutube = lazy(() => Promise.resolve({ default: () => <ComingSoon title="YouTube Sync Module" /> }));
const AdminAI = lazy(() => Promise.resolve({ default: () => <ComingSoon title="AI Processing Pipeline" /> }));
const AdminCategories = lazy(() => import('../pages/admin/categories').then(m => ({ default: m.AdminCategories })));
const AdminGods = lazy(() => Promise.resolve({ default: () => <ComingSoon title="Deities Manager" /> }));
const AdminFestivals = lazy(() => Promise.resolve({ default: () => <ComingSoon title="Festivals Manager" /> }));
const AdminSEO = lazy(() => Promise.resolve({ default: () => <ComingSoon title="SEO Optimization Engine" /> }));
const AdminMedia = lazy(() => import('../pages/admin/media').then(m => ({ default: m.AdminMedia })));
const AdminSettings = lazy(() => import('../pages/admin/settings').then(m => ({ default: m.AdminSettings })));

const NotFoundPage = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
    <h1 className="text-6xl font-black text-saffron mb-4">404</h1>
    <h2 className="text-3xl font-bold text-darkBrown mb-6">Page Not Found</h2>
    <p className="text-gray-600 mb-8 max-w-md mx-auto">
      The spiritual path you are looking for does not exist or has been moved.
    </p>
    <a href="/" className="px-6 py-3 bg-saffron text-white rounded-full font-bold hover:bg-golden transition-colors">
      Return Home
    </a>
  </div>
);

const AdminNotFoundPage = () => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
    <h1 className="text-6xl font-black text-gray-300 mb-4">404</h1>
    <h2 className="text-2xl font-bold text-darkBrown mb-2">Admin Resource Not Found</h2>
    <p className="text-gray-500 mb-6">
      The dashboard panel you are looking for does not exist.
    </p>
    <a href="/admin" className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors">
      Back to Dashboard
    </a>
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'bhajans',
        element: <BhajansList />,
      },
      {
        path: 'bhajans/:slug',
        element: <BhajanDetail />,
      },
      {
        path: 'videos',
        element: <VideosList />,
      },
      {
        path: 'videos/:slug',
        element: <BhajanDetail />,
      },
      {
        path: 'search',
        element: <SearchPage />,
      },
      {
        path: 'explore',
        element: <ExplorePage />,
      },
      {
        path: 'categories',
        element: <Categories />,
      },
      {
        path: 'categories/:id',
        element: <CollectionDetails />,
      },
      {
        path: 'gods',
        element: <Gods />,
      },
      {
        path: 'gods/:id',
        element: <CollectionDetails />,
      },
      {
        path: 'festivals',
        element: <Festivals />,
      },
      {
        path: 'festivals/:id',
        element: <CollectionDetails />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      }
    ],
  },
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <AdminDashboard />
      },
      {
        path: 'bhajans',
        element: <AdminBhajans />
      },
      {
        path: 'youtube',
        element: <AdminYoutube />
      },
      {
        path: 'ai',
        element: <AdminAI />
      },
      {
        path: 'categories',
        element: <AdminCategories />
      },
      {
        path: 'gods',
        element: <AdminGods />
      },
      {
        path: 'festivals',
        element: <AdminFestivals />
      },
      {
        path: 'seo',
        element: <AdminSEO />
      },
      {
        path: 'media',
        element: <AdminMedia />
      },
      {
        path: 'settings',
        element: <AdminSettings />
      },
      {
        path: '*',
        element: <AdminNotFoundPage />
      }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
