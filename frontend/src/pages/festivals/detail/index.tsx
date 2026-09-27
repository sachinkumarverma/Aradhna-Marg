import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { SafeHtmlContent } from '@components/common/SafeHtmlContent';
import { RelatedContentSection } from '@components/common/RelatedContentSection';
import { Breadcrumb } from '@components/common/Breadcrumb';
import { PublicApi } from '@api/publicApi';
import { useTranslation } from '@i18n/LanguageContext';

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
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#F9F7F3] pt-28">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron"></div>
      </div>
    );
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
    <div className="w-full min-h-screen bg-[#F9F7F3] pt-28 pb-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Festivals', to: '/festivals' }, { label: name }]} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column Primary Content (8 Columns) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 sm:p-10 border border-gray-100 shadow-sm"
            >
              {/* Title Header Row with Date Badge to the Right of Name & Special Badge at Right End */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                {/* Left: Festival Name + Date Badge on its right */}
                <div className="flex flex-wrap items-center gap-3.5">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-darkBrown tracking-tight leading-tight font-hindi-heading pt-1 pb-1">
                    {name}
                  </h1>
                  {festival.festival_date && (
                    <span className="px-3.5 py-1.5 bg-amber-50 text-saffron font-bold text-xs sm:text-sm rounded-full border border-amber-200 inline-flex items-center gap-2 font-hindi-body shrink-0 -translate-y-2 sm:-translate-y-2.5 shadow-xs">
                      <Calendar className="w-4 h-4 text-orange-600 fill-orange-500/25 shrink-0" />
                      <span className="pt-[1px] inline-block">
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
                <span className="px-3.5 py-1.5 bg-orange-50 text-orange-700 font-bold text-xs sm:text-sm rounded-full border border-orange-200 shrink-0 font-hindi-heading inline-flex items-center self-start md:self-auto -translate-y-2 sm:-translate-y-2.5 shadow-xs">
                  <span className="pt-[1px] inline-block">
                    {festival.category || 'Festival Special (त्योहार विशेष)'}
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
