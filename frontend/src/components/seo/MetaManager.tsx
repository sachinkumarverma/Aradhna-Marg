import React from 'react';
import { Helmet } from 'react-helmet-async';

export interface MetaManagerProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  keywords?: string[];
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    type?: 'website' | 'article' | 'video.other';
  };
  robots?: string;
}

export const MetaManager: React.FC<MetaManagerProps> = ({
  title,
  description,
  canonicalUrl,
  keywords,
  openGraph,
  robots = 'index, follow'
}) => {
  const siteName = 'Aradhna Marg';
  const fullTitle = `${title} | ${siteName}`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      <meta name="robots" content={robots} />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph / Facebook */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={openGraph?.title || fullTitle} />
      <meta property="og:description" content={openGraph?.description || description} />
      <meta property="og:type" content={openGraph?.type || 'website'} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {openGraph?.image && <meta property="og:image" content={openGraph.image} />}

      {/* Twitter Cards */}
      <meta name="twitter:card" content={openGraph?.image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={openGraph?.title || fullTitle} />
      <meta name="twitter:description" content={openGraph?.description || description} />
      {openGraph?.image && <meta name="twitter:image" content={openGraph.image} />}
    </Helmet>
  );
};
