import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, Tag } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { SafeHtmlContent } from '@components/common/SafeHtmlContent';
import { RelatedContentSection } from '@components/common/RelatedContentSection';
import { Breadcrumb } from '@components/common/Breadcrumb';
import { PublicApi } from '@api/publicApi';
import { useTranslation } from '@i18n/LanguageContext';

import { AdUnit } from '@components/common/AdUnit';
import { CustomLoader } from '@components/common/CustomLoader';
import { SEOHead, buildBreadcrumbSchema, buildArticleSchema } from '@components/seo';

export const ArticleDetail: React.FC = () => {
  const { language, t, getLocalizedField } = useTranslation();
  const { slug } = useParams();
  const [article, setArticle] = useState<any>(null);
  const [relatedData, setRelatedData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticleData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const [articleRes, relatedRes] = await Promise.all([
          PublicApi.getArticleBySlug(slug, language).catch((err) => {
            console.error('Failed to fetch article by slug:', err);
            return null;
          }),
          PublicApi.getArticleRelated(slug).catch((err) => {
            console.error('Failed to fetch article related:', err);
            return {};
          })
        ]);

        setArticle(articleRes);
        setRelatedData(relatedRes || {});

        const displayTitle = getLocalizedField(articleRes, 'title') || articleRes?.displayTitle || articleRes?.title;
        if (displayTitle) {
          document.title = articleRes.displaySeoTitle || displayTitle;
        }
      } catch (error) {
        console.error('Failed to fetch article detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticleData();
  }, [slug, language]);

  if (loading) {
    return <CustomLoader fullScreen text="धार्मिक लेख लोड हो रहा है..." />;
  }

  if (!article) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#F9F7F3] pt-28 text-center px-4">
        <SEOHead title={language === 'hi' ? 'धार्मिक लेख उपलब्ध नहीं है' : 'Article Not Found'} noIndex={true} />
        <h2 className="text-2xl font-bold text-darkBrown mb-4 font-hindi-heading">{t('errors.contentNotAvailable')}</h2>
        <p className="text-slate-600 mb-6 font-hindi-body">{t('errors.failedToLoad')}</p>
        <Link
          to="/articles"
          className="px-6 py-2.5 bg-saffron text-white rounded-md font-bold shadow-md hover:brightness-90 font-hindi-body"
        >
          {t('navigation.articles')}
        </Link>
      </div>
    );
  }

  const title = getLocalizedField(article, 'title') || article.displayTitle || article.title;
  const excerpt = getLocalizedField(article, 'excerpt') || article.displayExcerpt || article.excerpt;
  const content = getLocalizedField(article, 'content') || article.displayContent || article.content;
  const categoryName = getLocalizedField(article, 'category_name') || article.category_name;
  const isHi = language === 'hi';

  const pageTitle = article.seo_title || article.displaySeoTitle || title;
  const pageDesc =
    article.seo_description ||
    article.displaySeoDescription ||
    excerpt ||
    (isHi
      ? `${title} - सनातन धर्म, संस्कृति व भक्ति पर विस्तृत धार्मिक आलेख पढ़ें।`
      : `Read detailed spiritual article on ${title} on Aradhna Marg.`);

  const articleSchemas = [
    buildArticleSchema({
      title,
      description: pageDesc,
      url: `/articles/${article.slug || slug}`,
      image: article.banner_image || article.featured_image || article.image_url,
      datePublished: article.publish_date || article.created_at,
      dateModified: article.updated_at,
      authorName: article.author_name,
      inLanguage: isHi ? 'hi' : 'en'
    }),
    buildBreadcrumbSchema([
      { name: isHi ? 'मुख्य पृष्ठ' : 'Home', item: '/' },
      { name: isHi ? 'लेख' : 'Articles', item: '/articles' },
      { name: title, item: `/articles/${article.slug || slug}` }
    ])
  ];

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pt-2 sm:pt-3 md:pt-4 pb-16 sm:pb-24">
      <SEOHead
        title={pageTitle}
        description={pageDesc}
        canonicalPath={`/articles/${article.slug || slug}`}
        ogType="article"
        ogImage={article.banner_image || article.featured_image || article.image_url}
        publishedTime={article.publish_date || article.created_at}
        modifiedTime={article.updated_at}
        author={article.author_name}
        schema={articleSchemas}
      />
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs Header */}
        <div className="mb-3.5 sm:mb-6">
          <Breadcrumb
            items={[
              { label: isHi ? 'होम' : 'Home', to: '/' },
              { label: isHi ? 'लेख' : 'Articles', to: '/articles' },
              { label: title }
            ]}
          />
        </div>

        {/* 12-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Article Content (8 Columns) */}
          <div className="lg:col-span-8 min-w-0 w-full flex flex-col gap-6">
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Category & Meta Information Row */}
              <div className="flex flex-wrap items-center justify-between gap-y-2.5 gap-x-4 mb-4 pb-3 border-b border-gray-100">
                {categoryName && (
                  <span className="px-3 py-1 bg-saffron/10 text-saffron border border-saffron/20 font-bold text-xs rounded-full inline-flex items-center shrink-0 font-hindi-heading shadow-2xs">
                    {categoryName}
                  </span>
                )}

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium font-hindi-body">
                  {article.publish_date && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-saffron shrink-0" />
                      <span>
                        {new Date(article.publish_date).toLocaleDateString(language === 'en' ? 'en-US' : 'hi-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </span>
                  )}
                  {article.publish_date && article.author_name && <span className="text-slate-300 select-none">•</span>}
                  {article.author_name && (
                    <span className="inline-flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-saffron shrink-0" />
                      <span>{article.author_name}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-darkBrown tracking-tight leading-snug sm:leading-tight mb-4 font-hindi-heading">
                {title}
              </h1>

              {/* Excerpt */}
              {excerpt && (
                <div className="p-4 bg-amber-50/70 rounded-xl border-l-4 border-saffron mb-6 text-base font-medium text-slate-700 leading-relaxed italic font-hindi-body">
                  {excerpt}
                </div>
              )}

              {/* Featured Cover Image */}
              {article.featured_image_url && (
                <div className="w-full aspect-video rounded-xl overflow-hidden mb-8 bg-gray-100 shadow-sm border border-gray-100">
                  <img src={article.featured_image_url} alt={title} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Content */}
              <div className="mt-4 font-hindi-body">
                <SafeHtmlContent content={content} />
              </div>

              {/* Content Ad Unit */}
              <div className="my-8">
                <AdUnit slot="banner" label="ADVERTISEMENT • विज्ञापन" />
              </div>

              {/* Deities / Tags footer */}
              {article.deities && article.deities.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center gap-2 font-hindi-body">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-saffron" /> {t('content.relatedDeities')}:
                  </span>
                  {article.deities.map((d: any) => (
                    <Link
                      key={d.id}
                      to={`/gods/${d.slug || d.id}`}
                      className="px-3 py-1 bg-amber-50 text-saffron text-xs font-bold rounded-md hover:bg-amber-100 transition-colors"
                    >
                      {getLocalizedField(d, 'name') || d.name}
                    </Link>
                  ))}
                </div>
              )}
            </motion.article>
          </div>

          {/* Right Recommendation Sidebar (4 Columns) */}
          <div className="lg:col-span-4 min-w-0 w-full flex flex-col gap-6">
            <AdUnit slot="sidebar" label="ADVERTISEMENT • विज्ञापन" />
            <div className="sticky top-28 overflow-hidden">
              <RelatedContentSection
                relatedArticles={relatedData.relatedArticles}
                relatedBhajans={relatedData.relatedBhajans}
                relatedFestivals={relatedData.relatedFestivals}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
