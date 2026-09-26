import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, Tag } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { SafeHtmlContent } from '@components/common/SafeHtmlContent';
import { RelatedContentSection } from '@components/common/RelatedContentSection';
import { LanguageSwitcher } from '@components/common/LanguageSwitcher';
import { Breadcrumb } from '@components/common/Breadcrumb';
import { PublicApi } from '@api/publicApi';

export const ArticleDetail: React.FC = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState<any>(null);
  const [relatedData, setRelatedData] = useState<any>({});
  const [lang, setLang] = useState('hi');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticleData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const [articleRes, relatedRes] = await Promise.all([
          PublicApi.getArticleBySlug(slug, lang).catch((err) => {
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

        if (articleRes?.displayTitle || articleRes?.title) {
          document.title = articleRes.displaySeoTitle || articleRes.displayTitle || articleRes.title;
        }
      } catch (error) {
        console.error('Failed to fetch article detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticleData();
  }, [slug, lang]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#F9F7F3] pt-28">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#F9F7F3] pt-28 text-center px-4">
        <h2 className="text-2xl font-extrabold text-darkBrown mb-4">यह लेख उपलब्ध नहीं है।</h2>
        <p className="text-slate-600 mb-6">नवीनतम धार्मिक लेख पढ़ें।</p>
        <Link
          to="/articles"
          className="px-6 py-2.5 bg-saffron text-white rounded-md font-bold shadow-md hover:brightness-90"
        >
          लेख संग्रह पर जाएँ
        </Link>
      </div>
    );
  }

  const title = article.displayTitle || article.title;
  const excerpt = article.displayExcerpt || article.excerpt;
  const content = article.displayContent || article.content;

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pt-28 pb-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs & Language Switcher Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <Breadcrumb items={[{ label: 'होम', to: '/' }, { label: 'लेख संग्रह', to: '/articles' }, { label: title }]} />

          <LanguageSwitcher currentLang={lang} onChange={(l) => setLang(l)} />
        </div>

        {/* 12-Column Grid Layout with min-w-0 to prevent horizontal overflow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Article Content (8 Columns) */}
          <div className="lg:col-span-8 min-w-0 w-full flex flex-col gap-6">
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Meta Badges */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {article.category_name && (
                  <span className="px-3 py-1 bg-saffron/10 text-saffron font-bold text-xs rounded-md">
                    {article.category_name}
                  </span>
                )}
                {article.publish_date && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(article.publish_date).toLocaleDateString(lang === 'en' ? 'en-US' : 'hi-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                )}
                {article.author_name && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium ml-auto">
                    <User className="w-3.5 h-3.5" /> {article.author_name}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown tracking-tight leading-tight mb-4">
                {title}
              </h1>

              {/* Excerpt */}
              {excerpt && (
                <div className="p-4 bg-amber-50/70 rounded-xl border-l-4 border-saffron mb-6 text-base font-medium text-slate-700 leading-relaxed italic">
                  {excerpt}
                </div>
              )}

              {/* Featured Cover Image (Strict 16:9 Aspect Ratio) */}
              {article.featured_image_url && (
                <div className="w-full aspect-video rounded-xl overflow-hidden mb-8 bg-gray-100 shadow-sm border border-gray-100">
                  <img src={article.featured_image_url} alt={title} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Rich Content Rendered Safely with Paragraph Spacing */}
              <div className="mt-4">
                <SafeHtmlContent content={content} />
              </div>

              {/* Deities / Tags footer */}
              {article.deities && article.deities.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-saffron" /> सम्बन्धित देवता:
                  </span>
                  {article.deities.map((d: any) => (
                    <Link
                      key={d.id}
                      to={`/gods/${d.slug || d.id}`}
                      className="px-3 py-1 bg-amber-50 text-saffron text-xs font-bold rounded-md hover:bg-amber-100 transition-colors"
                    >
                      {d.name}
                    </Link>
                  ))}
                </div>
              )}
            </motion.article>
          </div>

          {/* Right Recommendation Sidebar (4 Columns) with min-w-0 & overflow-hidden */}
          <div className="lg:col-span-4 min-w-0 w-full">
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
