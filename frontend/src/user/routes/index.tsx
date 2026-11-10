import { Navigate, type RouteObject } from 'react-router-dom';
import { PublicLayout } from '@user/layouts/PublicLayout';
import { ENABLE_DONATIONS } from '@/constants';
import { lazyWithRetry } from '@utils/lazyWithRetry';
import { RouteErrorBoundary } from '@components/common/RouteErrorBoundary';

const Home = lazyWithRetry(() => import('@user/pages/home').then((m) => ({ default: m.Home })));
const BhajanDetail = lazyWithRetry(() =>
  import('@user/pages/bhajans/detail').then((m) => ({ default: m.BhajanDetail }))
);
const SearchPage = lazyWithRetry(() => import('@user/pages/search').then((m) => ({ default: m.SearchPage })));
const ExplorePage = lazyWithRetry(() => import('@user/pages/explore').then((m) => ({ default: m.ExplorePage })));
const CollectionDetails = lazyWithRetry(() =>
  import('@user/pages/collections/CollectionDetails').then((m) => ({ default: m.CollectionDetails }))
);
const VideosList = lazyWithRetry(() => import('@user/pages/videos').then((m) => ({ default: m.VideosList })));
const BhajansList = lazyWithRetry(() => import('@user/pages/bhajans').then((m) => ({ default: m.BhajansList })));
const ArticlesList = lazyWithRetry(() => import('@user/pages/articles').then((m) => ({ default: m.ArticlesList })));
const ArticleDetail = lazyWithRetry(() =>
  import('@user/pages/articles/detail').then((m) => ({ default: m.ArticleDetail }))
);
const FestivalsList = lazyWithRetry(() => import('@user/pages/festivals').then((m) => ({ default: m.FestivalsList })));
const FestivalDetail = lazyWithRetry(() =>
  import('@user/pages/festivals/detail').then((m) => ({ default: m.FestivalDetail }))
);
const PuranasList = lazyWithRetry(() => import('@user/pages/puranas').then((m) => ({ default: m.PuranasList })));
const PuranDetail = lazyWithRetry(() => import('@user/pages/puranas/detail').then((m) => ({ default: m.PuranDetail })));
const CategoriesList = lazyWithRetry(() =>
  import('@user/pages/categories').then((m) => ({ default: m.CategoriesList }))
);
const DeitiesList = lazyWithRetry(() => import('@user/pages/deities').then((m) => ({ default: m.DeitiesList })));
const TermsPage = lazyWithRetry(() => import('@user/pages/legal').then((m) => ({ default: m.TermsPage })));
const DisclaimerPage = lazyWithRetry(() => import('@user/pages/legal').then((m) => ({ default: m.DisclaimerPage })));
const PrivacyPolicyPage = lazyWithRetry(() =>
  import('@user/pages/legal').then((m) => ({ default: m.PrivacyPolicyPage }))
);
const AboutPage = lazyWithRetry(() => import('@user/pages/legal').then((m) => ({ default: m.AboutPage })));
const DonatePage = lazyWithRetry(() => import('@user/pages/donate').then((m) => ({ default: m.DonatePage })));
const ContactPage = lazyWithRetry(() => import('@user/pages/contact').then((m) => ({ default: m.ContactPage })));
const FavoritesPage = lazyWithRetry(() => import('@user/pages/favorites').then((m) => ({ default: m.FavoritesPage })));
const AuthPage = lazyWithRetry(() => import('@user/pages/auth/AuthPage').then((m) => ({ default: m.AuthPage })));
const ResetPasswordPage = lazyWithRetry(() =>
  import('@user/pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
);
const NotFoundPage = lazyWithRetry(() =>
  import('@user/pages/common/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

export const userRoutes: RouteObject[] = [
  // Standalone Auth & Account Recovery Pages (rendered WITHOUT PublicLayout / Navbar / Footer)
  {
    path: '/auth',
    element: <AuthPage />,
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '/login',
    element: <Navigate to="/auth?mode=login" replace />
  },
  {
    path: '/signup',
    element: <Navigate to="/auth?mode=signup" replace />
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
    errorElement: <RouteErrorBoundary />
  },
  // Main Public Application Layout (includes Navbar, AdBanner, Public Content, and Footer)
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <RouteErrorBoundary />,
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
        path: 'support-us',
        element: ENABLE_DONATIONS ? <DonatePage /> : <Navigate to="/" replace />
      },
      {
        path: 'donate',
        element: <Navigate to={ENABLE_DONATIONS ? '/support-us' : '/'} replace />
      },
      {
        path: 'favourite',
        element: <FavoritesPage />
      },
      {
        path: 'favorites',
        element: <FavoritesPage />
      },
      {
        path: 'contact',
        element: <ContactPage />
      },
      {
        path: '*',
        element: <NotFoundPage />
      }
    ]
  }
];
