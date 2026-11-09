import { lazy } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { PublicLayout } from '@user/layouts/PublicLayout';
import { ENABLE_DONATIONS } from '@/constants';

const Home = lazy(() => import('@user/pages/home').then((m) => ({ default: m.Home })));
const BhajanDetail = lazy(() => import('@user/pages/bhajans/detail').then((m) => ({ default: m.BhajanDetail })));
const SearchPage = lazy(() => import('@user/pages/search').then((m) => ({ default: m.SearchPage })));
const ExplorePage = lazy(() => import('@user/pages/explore').then((m) => ({ default: m.ExplorePage })));
const CollectionDetails = lazy(() =>
  import('@user/pages/collections/CollectionDetails').then((m) => ({ default: m.CollectionDetails }))
);
const VideosList = lazy(() => import('@user/pages/videos').then((m) => ({ default: m.VideosList })));
const BhajansList = lazy(() => import('@user/pages/bhajans').then((m) => ({ default: m.BhajansList })));
const ArticlesList = lazy(() => import('@user/pages/articles').then((m) => ({ default: m.ArticlesList })));
const ArticleDetail = lazy(() => import('@user/pages/articles/detail').then((m) => ({ default: m.ArticleDetail })));
const FestivalsList = lazy(() => import('@user/pages/festivals').then((m) => ({ default: m.FestivalsList })));
const FestivalDetail = lazy(() => import('@user/pages/festivals/detail').then((m) => ({ default: m.FestivalDetail })));
const PuranasList = lazy(() => import('@user/pages/puranas').then((m) => ({ default: m.PuranasList })));
const PuranDetail = lazy(() => import('@user/pages/puranas/detail').then((m) => ({ default: m.PuranDetail })));
const CategoriesList = lazy(() => import('@user/pages/categories').then((m) => ({ default: m.CategoriesList })));
const DeitiesList = lazy(() => import('@user/pages/deities').then((m) => ({ default: m.DeitiesList })));
const TermsPage = lazy(() => import('@user/pages/legal').then((m) => ({ default: m.TermsPage })));
const DisclaimerPage = lazy(() => import('@user/pages/legal').then((m) => ({ default: m.DisclaimerPage })));
const PrivacyPolicyPage = lazy(() => import('@user/pages/legal').then((m) => ({ default: m.PrivacyPolicyPage })));
const AboutPage = lazy(() => import('@user/pages/legal').then((m) => ({ default: m.AboutPage })));
const DonatePage = lazy(() => import('@user/pages/donate').then((m) => ({ default: m.DonatePage })));
const ContactPage = lazy(() => import('@user/pages/contact').then((m) => ({ default: m.ContactPage })));
const FavoritesPage = lazy(() => import('@user/pages/favorites').then((m) => ({ default: m.FavoritesPage })));
const AuthPage = lazy(() => import('@user/pages/auth/AuthPage').then((m) => ({ default: m.AuthPage })));
const ResetPasswordPage = lazy(() =>
  import('@user/pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
);
const NotFoundPage = lazy(() => import('@user/pages/common/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

export const userRoutes: RouteObject[] = [
  // Standalone Auth & Account Recovery Pages (rendered WITHOUT PublicLayout / Navbar / Footer)
  {
    path: '/auth',
    element: <AuthPage />
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
    element: <ResetPasswordPage />
  },
  // Main Public Application Layout (includes Navbar, AdBanner, Public Content, and Footer)
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
