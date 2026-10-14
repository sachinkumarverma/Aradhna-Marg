import React, { useEffect, useLayoutEffect } from 'react';
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

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Ensures document.head contains strictly ONE authoritative copy of canonical,
 * meta description, robots, OG tags, Twitter tags, and JSON-LD schema by removing
 * any duplicated prerendered or React 19 hoisted tags.
 */
function deduplicateHeadElements(options: {
  title: string;
  description: string;
  canonical?: string;
  keywords?: string;
  robots: string;
  ogType: string;
  siteName: string;
  ogImage: string;
  locale: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  noIndex: boolean;
  schemaJson?: string;
}) {
  if (typeof document === 'undefined') return;

  // 1. Deduplicate <title>
  const titles = Array.from(document.head.querySelectorAll('title'));
  if (titles.length > 1) {
    for (let i = 0; i < titles.length - 1; i++) {
      titles[i].remove();
    }
  }
  if (document.title !== options.title) {
    document.title = options.title;
  }

  // 2. Canonical Link - strictly one tag, or none if noIndex
  const canonicals = Array.from(document.head.querySelectorAll('link[rel="canonical"]'));
  if (options.noIndex || !options.canonical) {
    canonicals.forEach((el) => el.remove());
  } else {
    if (canonicals.length > 1) {
      for (let i = 0; i < canonicals.length - 1; i++) {
        canonicals[i].remove();
      }
    }
    const target = canonicals[canonicals.length - 1] || document.createElement('link');
    target.setAttribute('rel', 'canonical');
    target.setAttribute('href', options.canonical);
    if (!target.parentNode) {
      document.head.appendChild(target);
    }
  }

  // 3. Meta by name (description, keywords, robots, googlebot, twitter:*)
  const metaByName: Record<string, string | undefined> = {
    description: options.description,
    keywords: options.keywords,
    robots: options.robots,
    googlebot: options.robots,
    'twitter:card': 'summary_large_image',
    'twitter:site': TWITTER_HANDLE,
    'twitter:creator': TWITTER_HANDLE,
    'twitter:title': options.title,
    'twitter:description': options.description,
    'twitter:image': options.ogImage
  };

  for (const [name, value] of Object.entries(metaByName)) {
    const list = Array.from(document.head.querySelectorAll(`meta[name="${name}"]`));
    if (list.length > 1) {
      for (let i = 0; i < list.length - 1; i++) {
        list[i].remove();
      }
    }
    if (value) {
      const el = list[list.length - 1] || document.createElement('meta');
      el.setAttribute('name', name);
      el.setAttribute('content', value);
      if (!el.parentNode) {
        document.head.appendChild(el);
      }
    } else if (list.length > 0) {
      list[list.length - 1].remove();
    }
  }

  // 4. Meta by property (Open Graph & Article)
  const metaByProperty: Record<string, string | undefined> = {
    'og:site_name': options.siteName,
    'og:title': options.title,
    'og:description': options.description,
    'og:type': options.ogType,
    'og:url': options.canonical,
    'og:image': options.ogImage,
    'og:locale': options.locale,
    'article:published_time': options.publishedTime,
    'article:modified_time': options.modifiedTime,
    'article:author': options.author
  };

  for (const [prop, value] of Object.entries(metaByProperty)) {
    const list = Array.from(document.head.querySelectorAll(`meta[property="${prop}"]`));
    if (list.length > 1) {
      for (let i = 0; i < list.length - 1; i++) {
        list[i].remove();
      }
    }
    if (value) {
      const el = list[list.length - 1] || document.createElement('meta');
      el.setAttribute('property', prop);
      el.setAttribute('content', value);
      if (!el.parentNode) {
        document.head.appendChild(el);
      }
    } else if (list.length > 0) {
      list[list.length - 1].remove();
    }
  }

  // 5. Schema.org JSON-LD - strictly one script block
  const schemas = Array.from(
    document.head.querySelectorAll('script#ld-json-schema, script[type="application/ld+json"]')
  );
  if (options.schemaJson) {
    if (schemas.length > 1) {
      for (let i = 0; i < schemas.length - 1; i++) {
        schemas[i].remove();
      }
    }
    const el = (schemas[schemas.length - 1] as HTMLScriptElement) || document.createElement('script');
    el.id = 'ld-json-schema';
    el.type = 'application/ld+json';
    el.textContent = options.schemaJson;
    if (!el.parentNode) {
      document.head.appendChild(el);
    }
  } else if (schemas.length > 0) {
    schemas.forEach((s) => s.remove());
  }
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
      resolvedCanonical = `${SITE_ORIGIN}${cleanPath === '/' ? '/' : cleanPath.replace(/\/+$/, '')}`;
    } else if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      resolvedCanonical = `${SITE_ORIGIN}${path === '/' ? '/' : path.replace(/\/+$/, '')}`;
    } else {
      resolvedCanonical = `${SITE_ORIGIN}/`;
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

  const schemaJson = schema
    ? JSON.stringify(
        Array.isArray(schema)
          ? {
              '@context': 'https://schema.org',
              '@graph': schema.map((item) => {
                if (item && typeof item === 'object') {
                  const { '@context': _, ...cleanItem } = item;
                  return cleanItem;
                }
                return item;
              })
            }
          : schema
      )
    : undefined;

  // Active client-side DOM deduplication: cleans up duplicate tags after React 19 hydration
  useIsomorphicLayoutEffect(() => {
    deduplicateHeadElements({
      title: finalTitle,
      description: cleanDescription,
      canonical: resolvedCanonical,
      keywords: resolvedKeywords,
      robots: robotsDirective,
      ogType,
      siteName,
      ogImage: absoluteImage,
      locale: isHi ? 'hi_IN' : 'en_US',
      publishedTime,
      modifiedTime,
      author,
      noIndex,
      schemaJson
    });
  }, [
    finalTitle,
    cleanDescription,
    resolvedCanonical,
    resolvedKeywords,
    robotsDirective,
    ogType,
    siteName,
    absoluteImage,
    isHi,
    publishedTime,
    modifiedTime,
    author,
    noIndex,
    schemaJson
  ]);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      deduplicateHeadElements({
        title: finalTitle,
        description: cleanDescription,
        canonical: resolvedCanonical,
        keywords: resolvedKeywords,
        robots: robotsDirective,
        ogType,
        siteName,
        ogImage: absoluteImage,
        locale: isHi ? 'hi_IN' : 'en_US',
        publishedTime,
        modifiedTime,
        author,
        noIndex,
        schemaJson
      });
    });
    return () => cancelAnimationFrame(handle);
  }, [
    finalTitle,
    cleanDescription,
    resolvedCanonical,
    resolvedKeywords,
    robotsDirective,
    ogType,
    siteName,
    absoluteImage,
    isHi,
    publishedTime,
    modifiedTime,
    author,
    noIndex,
    schemaJson
  ]);

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
      {schemaJson && (
        <script id="ld-json-schema" type="application/ld+json">
          {schemaJson}
        </script>
      )}
    </Helmet>
  );
};
