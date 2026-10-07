import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  SITE_ORIGIN,
  SITE_NAME_EN,
  SITE_NAME_HI,
  DEFAULT_SEO,
  DEFAULT_OG_IMAGE,
  TWITTER_HANDLE
} from '@/constants/seo';
import { useTranslation } from '@/i18n/LanguageContext';

export interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  canonicalPath?: string;
  keywords?: string[] | string;
  ogType?: 'website' | 'article' | 'music.song' | 'video.other' | 'book';
  ogImage?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  noIndex?: boolean;
  schema?: Record<string, any> | Array<Record<string, any>>;
  lang?: 'hi' | 'en';
}

function stripHtml(html?: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  canonicalUrl,
  canonicalPath,
  keywords,
  ogType = 'website',
  ogImage,
  publishedTime,
  modifiedTime,
  author,
  noIndex = false,
  schema,
  lang: propLang
}) => {
  const { language: currentLang } = useTranslation();
  const activeLang = propLang || currentLang || 'en';
  const isHi = activeLang === 'hi';

  const defaultMeta = isHi ? DEFAULT_SEO.hi : DEFAULT_SEO.en;
  const siteName = isHi ? SITE_NAME_HI : SITE_NAME_EN;

  // Compute clean title
  let finalTitle: string;
  if (!title || title.trim() === '') {
    finalTitle = defaultMeta.title;
  } else if (title.includes('Aradhna Marg') || title.includes('आराधना मार्ग')) {
    finalTitle = title.trim();
  } else {
    finalTitle = `${title.trim()} | ${siteName}`;
  }

  // Compute clean description (clean HTML tags if present)
  const rawDesc = description || defaultMeta.description;
  const cleanDescription = stripHtml(rawDesc).slice(0, 200);

  // Compute canonical URL
  let resolvedCanonical = canonicalUrl;
  if (!resolvedCanonical) {
    if (canonicalPath) {
      const cleanPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
      resolvedCanonical = `${SITE_ORIGIN}${cleanPath}`;
    } else if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      resolvedCanonical = `${SITE_ORIGIN}${path === '/' ? '' : path}`;
    } else {
      resolvedCanonical = SITE_ORIGIN;
    }
  }

  // Compute keywords string
  const resolvedKeywords = Array.isArray(keywords)
    ? keywords.join(', ')
    : typeof keywords === 'string'
      ? keywords
      : defaultMeta.keywords.join(', ');

  // Compute Image
  const resolvedImage = ogImage || DEFAULT_OG_IMAGE;
  const absoluteImage = resolvedImage.startsWith('http')
    ? resolvedImage
    : `${SITE_ORIGIN}${resolvedImage.startsWith('/') ? '' : '/'}${resolvedImage}`;

  const robotsDirective = noIndex
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  return (
    <Helmet htmlAttributes={{ lang: activeLang, dir: 'ltr' }}>
      {/* Document Title */}
      <title>{finalTitle}</title>

      {/* Meta Tags */}
      <meta name="description" content={cleanDescription} />
      {resolvedKeywords && <meta name="keywords" content={resolvedKeywords} />}
      <meta name="robots" content={robotsDirective} />
      <meta name="googlebot" content={robotsDirective} />

      {/* Canonical Link */}
      {!noIndex && resolvedCanonical && <link rel="canonical" href={resolvedCanonical} />}

      {/* Open Graph / Social */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={cleanDescription} />
      <meta property="og:type" content={ogType} />
      {resolvedCanonical && <meta property="og:url" content={resolvedCanonical} />}
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:locale" content={isHi ? 'hi_IN' : 'en_US'} />

      {/* Article / Content specific OpenGraph */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={cleanDescription} />
      <meta name="twitter:image" content={absoluteImage} />

      {/* Schema.org Structured Data */}
      {schema && <script type="application/ld+json">{JSON.stringify(schema)}</script>}
    </Helmet>
  );
};
