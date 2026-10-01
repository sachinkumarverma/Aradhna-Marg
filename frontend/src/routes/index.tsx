import { lazy } from 'react';
import { createBrowserRouter, RouterProvider, Link } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Home } from '@pages/home';
import { BhajanDetail } from '@pages/bhajans/detail';
import { SearchPage } from '@pages/search';
import { ExplorePage } from '@pages/explore';
import { CollectionDetails } from '@pages/collections/CollectionDetails';
import { AdminLayout } from '@/layouts/admin/AdminLayout';
import { AdminDashboard } from '@pages/admin/dashboard';
import { AdminBhajans } from '@pages/admin/bhajans';
import { AdminBhajanForm } from '@pages/admin/bhajans/form';
import { VideosList } from '@pages/videos';
import { AdminLogin } from '@pages/admin/login';

import { BhajansList } from '@pages/bhajans';
import { ArticlesList } from '@pages/articles';
import { ArticleDetail } from '@pages/articles/detail';
import { FestivalsList } from '@pages/festivals';
import { FestivalDetail } from '@pages/festivals/detail';
import { PuranasList } from '@pages/puranas';
import { PuranDetail } from '@pages/puranas/detail';
import { CategoriesList } from '@pages/categories';
import { DeitiesList } from '@pages/deities';
import { TermsPage, DisclaimerPage, PrivacyPolicyPage, AboutPage } from '@pages/legal';

// Lazy loaded placeholders for future pages (Admin)
const AdminYoutube = lazy(() => import('../pages/admin/youtube').then((m) => ({ default: m.AdminYoutube })));
const AdminAI = lazy(() => import('../pages/admin/ai').then((m) => ({ default: m.AdminAI })));
const AdminCategories = lazy(() => import('../pages/admin/categories').then((m) => ({ default: m.AdminCategories })));
const AdminDeities = lazy(() => import('../pages/admin/deities').then((m) => ({ default: m.AdminDeities })));
const AdminFestivals = lazy(() => import('../pages/admin/festivals').then((m) => ({ default: m.AdminFestivals })));
const AdminFestivalForm = lazy(() =>
  import('../pages/admin/festivals/form').then((m) => ({ default: m.AdminFestivalForm }))
);
const AdminSEO = lazy(() => import('../pages/admin/seo').then((m) => ({ default: m.AdminSEO })));
const AdminMedia = lazy(() => import('../pages/admin/media').then((m) => ({ default: m.AdminMedia })));
const AdminSettings = lazy(() => import('../pages/admin/settings').then((m) => ({ default: m.AdminSettings })));
const AdminArticles = lazy(() => import('../pages/admin/articles').then((m) => ({ default: m.AdminArticles })));
const AdminArticleForm = lazy(() =>
  import('../pages/admin/articles/form').then((m) => ({ default: m.AdminArticleForm }))
);
const AdminPuranas = lazy(() => import('../pages/admin/puranas').then((m) => ({ default: m.AdminPuranas })));
const AdminPuranForm = lazy(() => import('../pages/admin/puranas/form').then((m) => ({ default: m.AdminPuranForm })));
const AdminAuthors = lazy(() => import('../pages/admin/authors').then((m) => ({ default: m.AdminAuthors })));
const AdminTags = lazy(() => import('../pages/admin/tags').then((m) => ({ default: m.AdminTags })));
const AdminAdvertisements = lazy(() =>
  import('../pages/admin/advertisements').then((m) => ({ default: m.AdminAdvertisements }))
);
const AdminSystemHealth = lazy(() =>
  import('../pages/admin/system-health').then((m) => ({ default: m.AdminSystemHealth }))
);

import { useTranslation } from '../i18n/LanguageContext';

const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-black text-saffron mb-4">404</h1>
      <h2 className="text-3xl font-bold text-darkBrown mb-6">{t('errors.pageNotFound')}</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">{t('errors.pageNotFoundDesc')}</p>
      <Link to="/" className="px-6 py-3 bg-saffron text-white rounded-full font-bold hover:bg-golden transition-colors">
        {t('errors.returnHome')}
      </Link>
    </div>
  );
};

const AdminNotFoundPage = () => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
    <h1 className="text-6xl font-black text-gray-300 mb-4">404</h1>
    <h2 className="text-2xl font-bold text-darkBrown mb-2">Admin Resource Not Found</h2>
    <p className="text-gray-500 mb-6">The dashboard panel you are looking for does not exist.</p>
    <Link
      to="/admin"
      className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-semibold transition-colors"
    >
      Back to Dashboard
    </Link>
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'bhajans',
        element: <BhajansList />
      },
      {
        path: 'bhajans/:slug',
        element: <BhajanDetail />
      },
      {
        path: 'articles',
        element: <ArticlesList />
      },
      {
        path: 'articles/:slug',
        element: <ArticleDetail />
      },
      {
        path: 'festivals',
        element: <FestivalsList />
      },
      {
        path: 'festivals/:id',
        element: <FestivalDetail />
      },
      {
        path: 'festivals/:slug',
        element: <FestivalDetail />
      },
      {
        path: 'puranas',
        element: <PuranasList />
      },
      {
        path: 'puranas/:slug',
        element: <PuranDetail />
      },
      {
        path: 'videos',
        element: <VideosList />
      },
      {
        path: 'videos/:slug',
        element: <BhajanDetail />
      },
      {
        path: 'search',
        element: <SearchPage />
      },
      {
        path: 'explore',
        element: <ExplorePage />
      },
      {
        path: 'categories',
        element: <CategoriesList />
      },
      {
        path: 'categories/:id',
        element: <CollectionDetails />
      },
      {
        path: 'gods',
        element: <DeitiesList />
      },
      {
        path: 'deities',
        element: <DeitiesList />
      },
      {
        path: 'gods/:id',
        element: <CollectionDetails />
      },
      {
        path: 'deities/:id',
        element: <CollectionDetails />
      },
      {
        path: 'about',
        element: <AboutPage />
      },
      {
        path: 'terms',
        element: <TermsPage />
      },
      {
        path: 'disclaimer',
        element: <DisclaimerPage />
      },
      {
        path: 'privacy',
        element: <PrivacyPolicyPage />
      },
      {
        path: '*',
        element: <NotFoundPage />
      }
    ]
  },
  {
    path: '/admin/login',
    element: <AdminLogin />
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
        path: 'ai',
        element: <AdminAI />
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
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
