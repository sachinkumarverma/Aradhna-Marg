import type { RouteObject } from 'react-router-dom';
import { PublicLayout } from '@user/layouts/PublicLayout';
import { Home } from '@user/pages/home';
import { BhajanDetail } from '@user/pages/bhajans/detail';
import { SearchPage } from '@user/pages/search';
import { ExplorePage } from '@user/pages/explore';
import { CollectionDetails } from '@user/pages/collections/CollectionDetails';
import { VideosList } from '@user/pages/videos';
import { BhajansList } from '@user/pages/bhajans';
import { ArticlesList } from '@user/pages/articles';
import { ArticleDetail } from '@user/pages/articles/detail';
import { FestivalsList } from '@user/pages/festivals';
import { FestivalDetail } from '@user/pages/festivals/detail';
import { PuranasList } from '@user/pages/puranas';
import { PuranDetail } from '@user/pages/puranas/detail';
import { CategoriesList } from '@user/pages/categories';
import { DeitiesList } from '@user/pages/deities';
import { TermsPage, DisclaimerPage, PrivacyPolicyPage, AboutPage } from '@user/pages/legal';
import { DonatePage } from '@user/pages/donate';
import { ContactPage } from '@user/pages/contact';
import { FavoritesPage } from '@user/pages/favorites';
import { NotFoundPage } from '@user/pages/common/NotFoundPage';

export const userRoutes: RouteObject[] = [
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
        element: <DonatePage />
      },
      {
        path: 'donate',
        element: <DonatePage />
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
