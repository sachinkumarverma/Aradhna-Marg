import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SITE_ORIGIN, SITE_NAME_EN, SITE_NAME_HI, DEFAULT_OG_IMAGE } from '@/constants/seo';

interface SchemaRendererProps {
  schema: Record<string, any> | Array<Record<string, any>>;
}

export const SchemaRenderer: React.FC<SchemaRendererProps> = ({ schema }) => {
  const jsonLd = JSON.stringify(schema);

  return (
    <Helmet>
      <script type="application/ld+json">{jsonLd}</script>
    </Helmet>
  );
};

export const buildWebSiteSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME_EN,
    alternateName: SITE_NAME_HI,
    url: SITE_ORIGIN,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_ORIGIN}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
};

export const buildOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME_EN,
    alternateName: SITE_NAME_HI,
    url: SITE_ORIGIN,
    logo: DEFAULT_OG_IMAGE,
    sameAs: ['https://www.youtube.com/@AradhnaMarg']
  };
};

export const buildBreadcrumbSchema = (items: Array<{ name: string; item: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.item.startsWith('http')
        ? crumb.item
        : `${SITE_ORIGIN}${crumb.item.startsWith('/') ? '' : '/'}${crumb.item}`
    }))
  };
};

export const buildArticleSchema = (article: {
  title: string;
  description?: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  inLanguage?: string;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url.startsWith('http')
        ? article.url
        : `${SITE_ORIGIN}${article.url.startsWith('/') ? '' : '/'}${article.url}`
    },
    headline: article.title,
    ...(article.description && { description: article.description }),
    image: article.image || DEFAULT_OG_IMAGE,
    ...(article.datePublished && { datePublished: article.datePublished }),
    ...(article.dateModified && { dateModified: article.dateModified }),
    author: {
      '@type': 'Organization',
      name: article.authorName || SITE_NAME_EN,
      url: SITE_ORIGIN
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME_EN,
      logo: {
        '@type': 'ImageObject',
        url: DEFAULT_OG_IMAGE
      }
    },
    inLanguage: article.inLanguage || 'hi'
  };
};

export const buildMusicCompositionSchema = (item: {
  name: string;
  description?: string;
  url: string;
  composer?: string;
  lyricsText?: string;
  inLanguage?: string;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicComposition',
    name: item.name,
    ...(item.description && { description: item.description }),
    url: item.url.startsWith('http') ? item.url : `${SITE_ORIGIN}${item.url.startsWith('/') ? '' : '/'}${item.url}`,
    ...(item.composer && { composer: { '@type': 'Person', name: item.composer } }),
    ...(item.lyricsText && { lyrics: { '@type': 'CreativeWork', text: item.lyricsText } }),
    inLanguage: item.inLanguage || 'hi'
  };
};

export const buildBookSchema = (book: { name: string; description?: string; url: string; inLanguage?: string }) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.name,
    ...(book.description && { description: book.description }),
    url: book.url.startsWith('http') ? book.url : `${SITE_ORIGIN}${book.url.startsWith('/') ? '' : '/'}${book.url}`,
    inLanguage: book.inLanguage || 'hi'
  };
};

export const buildEventSchema = (event: {
  name: string;
  description?: string;
  url: string;
  startDate?: string;
  endDate?: string;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    ...(event.description && { description: event.description }),
    url: event.url.startsWith('http') ? event.url : `${SITE_ORIGIN}${event.url.startsWith('/') ? '' : '/'}${event.url}`,
    ...(event.startDate && { startDate: event.startDate }),
    ...(event.endDate && { endDate: event.endDate }),
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled'
  };
};
