import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { SafeHtmlContent } from '@components/common/SafeHtmlContent';
import { RelatedContentSection } from '@components/common/RelatedContentSection';
import { LanguageSwitcher } from '@components/common/LanguageSwitcher';
import { Breadcrumb } from '@components/common/Breadcrumb';
import { PublicApi } from '@api/publicApi';

export const FestivalDetail: React.FC = () => {
  const params = useParams();
  const festivalIdOrSlug = params.slug || params.id;
  const [festival, setFestival] = useState<any>(null);
  const [relatedData, setRelatedData] = useState<any>({});
  const [lang, setLang] = useState('hi');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchFestivalData = async () => {
      if (!festivalIdOrSlug) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [festRes, relatedRes] = await Promise.all([
          PublicApi.getFestivalBySlug(festivalIdOrSlug, lang).catch((err) => {
            console.error('Failed to fetch festival by slug:', err);
            return null;
          }),
          PublicApi.getFestivalRelated(festivalIdOrSlug).catch((err) => {
            console.error('Failed to fetch festival related:', err);
            return {};
          })
        ]);

        if (isMounted) {
          setFestival(festRes);
          setRelatedData(relatedRes || {});

          if (festRes?.displayName || festRes?.name) {
            document.title = festRes.seo_title || festRes.displayName || festRes.name;
          }
        }
      } catch (error) {
        console.error('Failed to fetch festival detail:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFestivalData();

    return () => {
      isMounted = false;
    };
  }, [festivalIdOrSlug, lang]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#F9F7F3] pt-28">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron"></div>
      </div>
    );
  }

  if (!festival) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#F9F7F3] pt-28 text-center px-4">
        <h2 className="text-3xl font-black text-darkBrown mb-4">यह त्यौहार उपलब्ध नहीं है।</h2>
        <p className="text-slate-600 mb-6">प्रमुख व्रत एवं त्यौहारों की सूची देखें।</p>
        <Link
          to="/festivals"
          className="px-6 py-3 bg-saffron text-white rounded-md font-bold shadow-md hover:brightness-90"
        >
          सभी त्यौहार देखें
        </Link>
      </div>
    );
  }

  const name = festival.displayName || festival.name || 'Festival';
  const description = festival.displayDescription || festival.short_description || '';
  const content =
    festival.displayContent || festival.content || festival.short_description || festival.description || '';

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pt-28 pb-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb & Language Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <Breadcrumb
            items={[{ label: 'होम', to: '/' }, { label: 'व्रत एवं त्यौहार', to: '/festivals' }, { label: name }]}
          />

          <LanguageSwitcher currentLang={lang} onChange={(l) => setLang(l)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column Primary Content (8 Columns) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 sm:p-10 border border-gray-100 shadow-sm"
            >
              {/* Title & Date Badges */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {festival.festival_date && (
                  <span className="px-3.5 py-1 bg-amber-50 text-saffron font-bold text-xs rounded-full border border-amber-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(festival.festival_date).toLocaleDateString(lang === 'en' ? 'en-US' : 'hi-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                )}
                {festival.category && (
                  <span className="px-3.5 py-1 bg-orange-50 text-orange-700 font-bold text-xs rounded-full border border-orange-200">
                    {festival.category}
                  </span>
                )}
              </div>

              {/* Main Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-darkBrown tracking-tight leading-tight mb-4">
                {name}
              </h1>

              {/* Short Description */}
              {description && (
                <p className="text-slate-600 text-base md:text-lg font-medium leading-relaxed mb-8 border-b border-gray-100 pb-6">
                  {description}
                </p>
              )}

              {/* Banner Image (Placed below Title & Description) */}
              {festival.banner_image && (
                <div className="w-full rounded-lg overflow-hidden mb-8 max-h-[420px] bg-gray-100 border border-gray-100 shadow-sm">
                  <img src={festival.banner_image} alt={name} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Rich Content Rendered Safely */}
              <div className="mt-2">
                <SafeHtmlContent content={content} />
              </div>
            </motion.div>
          </div>

          {/* Right Column Intelligent Recommendation Sidebar (4 Columns) */}
          <div className="lg:col-span-4">
            <div className="sticky top-28">
              <RelatedContentSection
                relatedBhajans={
                  Array.isArray(festival.related_bhajans) && festival.related_bhajans.length > 0
                    ? festival.related_bhajans
                    : Array.isArray(relatedData?.relatedBhajans)
                      ? relatedData.relatedBhajans
                      : []
                }
                relatedArticles={
                  Array.isArray(festival.related_articles) && festival.related_articles.length > 0
                    ? festival.related_articles
                    : Array.isArray(relatedData?.relatedArticles)
                      ? relatedData.relatedArticles
                      : []
                }
                relatedFestivals={Array.isArray(relatedData?.relatedFestivals) ? relatedData.relatedFestivals : []}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
