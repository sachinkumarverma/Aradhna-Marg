import React from 'react';
import { Helmet } from 'react-helmet-async';

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

// Helper exports to ensure schema complies with schema.org types natively in TS
export const buildBreadcrumbSchema = (items: Array<{ name: string; item: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.item
    }))
  };
};

export const buildFAQSchema = (faqs: Array<{ question: string; answer: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
};

export const buildVideoSchema = (video: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  embedUrl?: string;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.name,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    uploadDate: video.uploadDate,
    ...(video.embedUrl && { embedUrl: video.embedUrl })
  };
};
