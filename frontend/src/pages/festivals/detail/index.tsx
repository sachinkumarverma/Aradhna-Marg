import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { SafeHtmlContent } from '@components/common/SafeHtmlContent';
import { RelatedContentSection } from '@components/common/RelatedContentSection';
import { Breadcrumb } from '@components/common/Breadcrumb';
import { PublicApi } from '@api/publicApi';
import { useTranslation } from '@i18n/LanguageContext';

import { AdUnit } from '@components/common/AdUnit';
import { CustomLoader } from '@components/common/CustomLoader';

export const FestivalDetail: React.FC = () => {
  const { language, t, getLocalizedField } = useTranslation();
  const params = useParams();
  const festivalIdOrSlug = params.slug || params.id;
  const [festival, setFestival] = useState<any>(null);
  const [relatedData, setRelatedData] = useState<any>({});
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
          PublicApi.getFestivalBySlug(festivalIdOrSlug, language).catch((err) => {
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

          const name = getLocalizedField(festRes, 'name') || festRes?.displayName || festRes?.name;
          if (name) {
            document.title = festRes.seo_title || name;
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
  }, [festivalIdOrSlug, language]);

  if (loading) {
    return <CustomLoader fullScreen text="त्योहार विवरण लोड हो रहा है..." />;
  }

  if (!festival) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#F9F7F3] pt-28 text-center px-4 font-hindi-body">
        <h2 className="text-3xl font-black text-darkBrown mb-4 font-hindi-heading">
          {t('errors.contentNotAvailable')}
        </h2>
        <p className="text-slate-600 mb-6">{t('errors.failedToLoad')}</p>
        <Link
          to="/festivals"
          className="px-6 py-3 bg-saffron text-white rounded-md font-bold shadow-md hover:brightness-90"
        >
          {t('navigation.festivals')}
        </Link>
      </div>
    );
  }

  const name = getLocalizedField(festival, 'name') || festival.displayName || festival.name || 'Festival';
  const description =
    getLocalizedField(festival, 'short_description') || festival.displayDescription || festival.short_description || '';
  const content = getLocalizedField(festival, 'content') || festival.displayContent || festival.content || description;

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pt-8 pb-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Festivals', to: '/festivals' }, { label: name }]} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column Primary Content (8 Columns) */}
          <div className="lg:col-span-8 min-w-0 w-full flex flex-col gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 sm:p-10 border border-gray-100 shadow-sm"
            >
              {/* Title Header Row with Name, Date Badge & Special Badge all on the same line */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                {/* Left: Festival Name + Date Badge on its right */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-darkBrown tracking-tight leading-tight font-hindi-heading">
                    {name}
                  </h1>
                  {festival.festival_date && (
                    <span className="px-2.5 py-1 bg-amber-50 text-saffron font-bold text-xs rounded-full border border-amber-200 inline-flex items-center gap-1.5 font-hindi-body shrink-0 shadow-xs">
                      <Calendar className="w-3.5 h-3.5 text-orange-600 fill-orange-500/25 shrink-0 -translate-y-[0.5px]" />
                      <span className="translate-y-[1px] inline-block leading-none">
                        {new Date(festival.festival_date).toLocaleDateString(language === 'en' ? 'en-US' : 'hi-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </span>
                  )}
                </div>

                {/* Right End: Special / Category Badge */}
                <span className="px-2.5 py-1 bg-orange-50 text-orange-700 font-bold text-xs rounded-full border border-orange-200 shrink-0 font-hindi-heading inline-flex items-center shadow-xs">
                  <span>
                    {getLocalizedField(festival, 'category') ||
                      (language === 'hi' ? 'त्योहार विशेष' : 'Festival Special')}
                  </span>
                </span>
              </div>

              {/* Short Description */}
              {description && (
                <p className="text-slate-600 text-base md:text-lg font-medium leading-relaxed mb-8 border-b border-gray-100 pb-6 font-hindi-body">
                  {description}
                </p>
              )}

              {/* Banner Image */}
              {festival.banner_image && (
                <div className="w-full rounded-lg overflow-hidden mb-8 max-h-[420px] bg-gray-100 border border-gray-100 shadow-sm">
                  <img src={festival.banner_image} alt={name} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Rich Content */}
              <div className="mt-2 font-hindi-body">
                <SafeHtmlContent content={content} />
              </div>

              {/* Content Ad Unit */}
              <div className="mt-8">
                <AdUnit slot="banner" label="ADVERTISEMENT • विज्ञापन" />
              </div>
            </motion.div>
          </div>

          {/* Right Column Intelligent Recommendation Sidebar (4 Columns) */}
          <div className="lg:col-span-4 min-w-0 w-full flex flex-col gap-6">
            <AdUnit slot="sidebar" label="ADVERTISEMENT • विज्ञापन" />
            <div className="sticky top-28 overflow-hidden">
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
