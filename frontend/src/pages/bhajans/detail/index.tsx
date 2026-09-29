import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Eye, Clock, Calendar, Music, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { YouTubePlayer } from './components/YouTubePlayer';
import { SafeHtmlContent } from '@components/common/SafeHtmlContent';
import { RelatedContentSection } from '@components/common/RelatedContentSection';
import { Breadcrumb } from '@components/common/Breadcrumb';
import { PublicApi } from '@api/publicApi';
import { useClipboard } from '@hooks/useClipboard';
import { SocialShareButtons } from '@components/common/SocialShareButtons';
import { AdUnit } from '@components/common/AdUnit';
import { BottomRelatedContent } from '@components/common/BottomRelatedContent';
import { useTranslation } from '@i18n/LanguageContext';
import { IconText } from '@components/common/IconText';

import { CustomLoader } from '@components/common/CustomLoader';

export const BhajanDetail: React.FC = () => {
  const { t, getLocalizedField } = useTranslation();
  const { slug } = useParams();
  const [bhajan, setBhajan] = useState<any>(null);
  const [relatedData, setRelatedData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const { copied, copyToClipboard } = useClipboard();

  useEffect(() => {
    const fetchBhajanData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const [bhajanRes, relatedRes] = await Promise.all([
          PublicApi.getBhajanBySlug(slug),
          PublicApi.getBhajanRelated(slug).catch(() => ({}))
        ]);

        setBhajan(bhajanRes);
        setRelatedData(relatedRes || {});

        // Dynamic Document Title for SEO
        if (bhajanRes?.title) {
          document.title = bhajanRes.seo_title || `${bhajanRes.title} - आराधना मार्ग`;
        }
      } catch (error) {
        console.error('Failed to fetch bhajan detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBhajanData();
  }, [slug]);

  if (loading) {
    return <CustomLoader fullScreen text="भजन लोड हो रहा है..." />;
  }

  if (!bhajan) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#F9F7F3] pt-28 text-center px-4">
        <h2 className="text-3xl font-black text-darkBrown mb-4">यह भजन उपलब्ध नहीं है।</h2>
        <p className="text-slate-600 mb-6">खोजें हमारे विशाल भजन संग्रह में।</p>
        <Link
          to="/bhajans"
          className="px-6 py-3 bg-saffron text-white rounded-md font-bold shadow-md hover:brightness-90"
        >
          सभी भजन देखें
        </Link>
      </div>
    );
  }

  const handleCopy = () => {
    const textToCopy = bhajan.lyrics || bhajan.clean_lyrics || bhajan.description || '';
    copyToClipboard(textToCopy);
  };

  const dateSource = bhajan.publish_date || bhajan.published_at || bhajan.published_date || bhajan.created_at;
  const formattedDate = dateSource
    ? new Date(dateSource).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pt-28 pb-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="mb-8">
          <Breadcrumb
            items={[{ label: 'होम', to: '/' }, { label: 'भजन संग्रह', to: '/bhajans' }, { label: bhajan.title }]}
          />
        </div>

        {/* Main Grid: Left Primary Content (Video & Description), Right Sidebar (Deity & Dark Title Card) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 Columns) */}
          <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
            {/* YouTube Player Section */}
            {bhajan.youtube_video_id && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-black rounded-3xl overflow-hidden shadow-lg border border-amber-900/30"
              >
                <YouTubePlayer videoId={bhajan.youtube_video_id} title={bhajan.title} />
              </motion.div>
            )}

            {/* Description & Lyrics Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-b from-[#FFFDF9] via-white to-[#FFF9EE] rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-md"
            >
              <div className="flex items-center justify-between pb-4 border-b border-amber-200/60 mb-6">
                <IconText
                  icon={<Music className="w-6 h-6 text-saffron" />}
                  gap="gap-2.5"
                  as="h2"
                  className="text-xl sm:text-2xl font-bold text-darkBrown font-hindi-heading leading-tight"
                  text={t('content.lyricsAndDescription')}
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-darkBrown border border-amber-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" /> {t('content.lyricsCopied')}
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-saffron" /> {t('content.copyLyrics')}
                    </>
                  )}
                </button>
              </div>

              {bhajan.short_description && (
                <p className="text-slate-700 text-base md:text-lg font-medium leading-relaxed mb-6">
                  {bhajan.short_description}
                </p>
              )}

              {/* Render Lyrics using SafeHtmlContent if HTML, or formatted text preserves whitespace */}
              {bhajan.lyrics ? (
                bhajan.lyrics.includes('<') ? (
                  <SafeHtmlContent content={bhajan.lyrics} className="text-darkBrown" />
                ) : (
                  <div className="whitespace-pre-line text-base sm:text-lg font-medium text-darkBrown leading-relaxed tracking-wide font-sans">
                    {bhajan.lyrics}
                  </div>
                )
              ) : bhajan.description ? (
                <div className="whitespace-pre-line text-base sm:text-lg font-medium text-darkBrown leading-relaxed">
                  {bhajan.description}
                </div>
              ) : (
                <p className="text-gray-500 italic">बोल उपलब्ध नहीं हैं।</p>
              )}
            </motion.div>

            {/* Ad Unit Placeholder */}
            <AdUnit slot="banner" label="ADVERTISEMENT • विज्ञापन" />

            {/* Bottom Related Content: Scriptures & PDFs, Bhajans */}
            <BottomRelatedContent
              relatedPuranas={relatedData.relatedPuranas}
              relatedBhajans={relatedData.relatedBhajans}
            />
          </div>

          {/* Right Column (4 Columns): Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="sticky top-28 flex flex-col gap-6">
              {/* 1. Dark Brown Title Info Card (Placed at TOP of sidebar) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#3D261C] rounded-3xl p-6 text-white shadow-xl border border-amber-900/40 relative overflow-hidden flex flex-col gap-4"
              >
                {/* Category / God Badge */}
                {(bhajan.god_name || bhajan.category_name) && (
                  <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-white/10 text-saffron font-bold text-xs uppercase tracking-wider self-start border border-white/10">
                    {bhajan.god_name || bhajan.category_name}
                  </div>
                )}

                {/* Title */}
                <h3 className="text-lg sm:text-xl font-bold text-white leading-snug tracking-tight">{bhajan.title}</h3>

                {/* Metadata Row: Views, Duration, Date */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-amber-100/80 font-medium">
                  {bhajan.views > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-saffron" /> {bhajan.views} views
                    </span>
                  )}
                  {bhajan.duration && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-saffron" /> {bhajan.duration}
                    </span>
                  )}
                  {formattedDate && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-saffron" /> {formattedDate}
                    </span>
                  )}
                </div>

                {/* Action Row: Social Share */}
                <div className="pt-3 border-t border-white/15 mt-1">
                  <SocialShareButtons
                    title={bhajan.title}
                    excerpt={bhajan.short_description || bhajan.god_name}
                    url={`/bhajans/${bhajan.slug || bhajan.id}`}
                  />
                </div>
              </motion.div>

              {/* 2. Explore Deity Card (Rendered below Dark Brown Card if deity info exists) */}
              {bhajan.god_name && (
                <Link
                  to={`/gods/${bhajan.god_slug || bhajan.god_id || ''}`}
                  className="group block bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="flex items-center gap-1.5 text-saffron font-bold text-xs uppercase tracking-wider mb-3">
                    <span className="text-sm">✨</span> EXPLORE DEITY
                  </div>
                  <div className="flex items-center gap-3.5 mb-3.5">
                    <img
                      src={bhajan.god_image || '/Deities/Krishna.png'}
                      alt={bhajan.god_name}
                      className="w-14 h-14 rounded-lg object-cover shadow-sm border-2 border-amber-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-lg font-bold text-darkBrown group-hover:text-saffron transition-colors truncate">
                        {bhajan.god_name}
                      </h4>
                    </div>
                  </div>
                  <span className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-saffron text-white rounded-xl font-bold text-xs group-hover:brightness-90 transition-colors shadow-sm">
                    View Deity Page &rarr;
                  </span>
                </Link>
              )}

              {/* 3. Google AdSense Advertisement Area (Placed right below Explore Deity) */}
              <AdUnit slot="sidebar" label="ADVERTISEMENT • विज्ञापन" />

              {/* 4. Recommendation Sidebar */}
              <RelatedContentSection
                relatedBhajans={relatedData.relatedBhajans}
                relatedArticles={relatedData.relatedArticles}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
