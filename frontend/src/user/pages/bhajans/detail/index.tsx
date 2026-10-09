import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Eye, Clock, Calendar, Music, Sparkles, Heart } from 'lucide-react';
import { Link, useParams, useLocation } from 'react-router-dom';
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
import { useFavorites } from '@hooks/useFavorites';

import { CustomLoader } from '@components/common/CustomLoader';
import { SEOHead, buildBreadcrumbSchema, buildMusicCompositionSchema } from '@components/seo';

export const BhajanDetail: React.FC = () => {
  const { language, t, getLocalizedField } = useTranslation();
  const { slug } = useParams();
  const location = useLocation();
  const isVideo = location.pathname.startsWith('/videos');

  const [bhajan, setBhajan] = useState<any>(null);
  const [relatedData, setRelatedData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const { copied, copyToClipboard } = useClipboard();
  const { isFavorite, toggleFavorite } = useFavorites();

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

  const isHi = language === 'hi';

  if (loading) {
    return (
      <CustomLoader
        fullScreen
        text={
          isVideo
            ? isHi
              ? 'वीडियो लोड हो रहा है...'
              : 'Loading video...'
            : isHi
              ? 'भजन लोड हो रहा है...'
              : 'Loading bhajan...'
        }
      />
    );
  }

  if (!bhajan) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#F9F7F3] pt-28 text-center px-4">
        <SEOHead
          title={
            isHi
              ? isVideo
                ? 'वीडियो उपलब्ध नहीं है'
                : 'भजन उपलब्ध नहीं है'
              : isVideo
                ? 'Video Not Found'
                : 'Bhajan Not Found'
          }
          noIndex={true}
        />
        <h2 className="text-3xl font-black text-darkBrown mb-4">
          {isHi
            ? isVideo
              ? 'यह वीडियो उपलब्ध नहीं है।'
              : 'यह भजन उपलब्ध नहीं है।'
            : isVideo
              ? 'Video Not Found'
              : 'Bhajan Not Found'}
        </h2>
        <p className="text-slate-600 mb-6">
          {isHi
            ? isVideo
              ? 'खोजें हमारे विशाल वीडियो संग्रह में।'
              : 'खोजें हमारे विशाल भजन संग्रह में।'
            : isVideo
              ? 'Explore our devotional video collection.'
              : 'Explore our devotional bhajan collection.'}
        </p>
        <Link
          to={isVideo ? '/videos' : '/bhajans'}
          className="px-6 py-3 bg-saffron text-white rounded-md font-bold shadow-md hover:brightness-90"
        >
          {isVideo ? (isHi ? 'सभी वीडियो' : 'All Videos') : t('common.allBhajans')}
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
  const cardId = String(bhajan?.id || bhajan?.slug || slug || '');
  const hearted = isFavorite(cardId);
  const itemUrl = isVideo ? `/videos/${bhajan.slug || slug}` : `/bhajans/${bhajan.slug || slug}`;
  const sectionName = isHi ? (isVideo ? 'वीडियो' : 'भजन') : isVideo ? 'Videos' : 'Bhajans';
  const sectionPath = isVideo ? '/videos' : '/bhajans';

  const favoriteItem = bhajan
    ? {
        id: cardId,
        type: isVideo ? ('video' as const) : ('bhajan' as const),
        title: bhajan.title,
        englishTitle: bhajan.english_title || bhajan.title_en,
        thumbnailUrl: bhajan.thumbnail_url || bhajan.image_url,
        url: itemUrl,
        subtitle: bhajan.god_name,
        category: isVideo ? 'Video' : bhajan.god_name || 'Bhajan'
      }
    : null;

  const displayTitle = getLocalizedField(bhajan, 'title') || bhajan.title;
  const pageTitle =
    bhajan.seo_title ||
    `${displayTitle} ${isHi ? (isVideo ? '- पावन वीडियो दर्शन' : '- लिरिक्स व वीडियो') : isVideo ? '- Devotional Video' : '- Lyrics & Video'}`;
  const pageDescription =
    bhajan.seo_description ||
    bhajan.description ||
    (isHi
      ? isVideo
        ? `${displayTitle} दिव्य भक्तिमय वीडियो का आनंद लें।`
        : `${displayTitle} भजन के पावन लिरिक्स, अर्थ, कथा एवं भक्तिमय वीडियो का आनंद लें।`
      : isVideo
        ? `Watch sacred devotional video for ${displayTitle} on Aradhna Marg.`
        : `Read sacred lyrics, meaning, and watch devotional video for ${displayTitle} on Aradhna Marg.`);

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: isHi ? 'मुख्य पृष्ठ' : 'Home', item: '/' },
    { name: sectionName, item: sectionPath },
    { name: displayTitle, item: itemUrl }
  ]);

  const detailSchemas = isVideo
    ? [breadcrumbSchema]
    : [
        buildMusicCompositionSchema({
          name: displayTitle,
          description: pageDescription,
          url: itemUrl,
          composer: bhajan.singer || bhajan.author_name,
          lyricsText: bhajan.lyrics,
          inLanguage: isHi ? 'hi' : 'en'
        }),
        breadcrumbSchema
      ];

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pt-2 sm:pt-3 md:pt-4 pb-16 sm:pb-24">
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        canonicalPath={itemUrl}
        ogType={isVideo ? 'video.other' : 'music.song'}
        ogImage={bhajan.thumbnail_url || bhajan.image_url}
        publishedTime={bhajan.created_at}
        modifiedTime={bhajan.updated_at}
        schema={detailSchemas}
      />
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="mb-3.5 sm:mb-6">
          <Breadcrumb
            items={[
              { label: 'होम', to: '/' },
              { label: isVideo ? 'दिव्य वीडियो' : 'भजन संग्रह', to: sectionPath },
              { label: bhajan.title }
            ]}
          />
        </div>

        {/* Main Grid: Left Primary Content (Video & Description), Right Sidebar (Deity & Dark Title Card) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 Columns) */}
          <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
            {/* YouTube Player or Hero Thumbnail Section */}
            {bhajan.youtube_video_id ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-black rounded-xl overflow-hidden shadow-md border border-amber-900/30"
              >
                <YouTubePlayer videoId={bhajan.youtube_video_id} title={bhajan.title} />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-md border border-amber-200/80 bg-stone-900"
              >
                <img
                  src={
                    bhajan.thumbnail_url ||
                    bhajan.image_url ||
                    bhajan.open_graph_image ||
                    bhajan.god_image ||
                    '/Deities/Krishna.png'
                  }
                  alt={bhajan.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-5 sm:p-7 text-white">
                  {(bhajan.god_name || bhajan.category_name) && (
                    <span className="px-3 py-1 bg-saffron text-white text-xs font-bold rounded-lg self-start mb-2 shadow-xs font-hindi-heading uppercase tracking-wide">
                      {bhajan.god_name || bhajan.category_name}
                    </span>
                  )}
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-amber-50 leading-tight font-hindi-heading drop-shadow-md">
                    {bhajan.title}
                  </h1>
                </div>
              </motion.div>
            )}

            {/* Description & Lyrics Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-b from-[#FFFDF9] via-white to-[#FFF9EE] rounded-xl p-4 sm:p-7 border border-amber-200/80 shadow-xs"
            >
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-amber-200/60 mb-4 sm:mb-6">
                <IconText
                  icon={<Music className="w-5 h-5 sm:w-6 sm:h-6 text-saffron shrink-0" />}
                  gap="gap-2 sm:gap-2.5"
                  as="h2"
                  className="text-base sm:text-lg md:text-xl font-bold text-darkBrown font-hindi-heading leading-tight"
                  text={t('content.lyricsAndDescription')}
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  title={copied ? t('content.lyricsCopied') : t('content.copyLyrics')}
                  aria-label={copied ? t('content.lyricsCopied') : t('content.copyLyrics')}
                  className="p-1 sm:px-3 sm:py-1 bg-transparent sm:bg-amber-50 hover:bg-amber-100/60 sm:hover:bg-amber-100 text-darkBrown border-0 sm:border sm:border-amber-200 text-xs font-bold rounded-lg sm:rounded-xl transition-all flex items-center gap-1.5 shadow-none sm:shadow-xs cursor-pointer active:scale-95 shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      <span className="hidden sm:inline font-hindi-heading">{t('content.lyricsCopied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-saffron" />
                      <span className="hidden sm:inline font-hindi-heading">{t('content.copyLyrics')}</span>
                    </>
                  )}
                </button>
              </div>

              {bhajan.short_description && (
                <p className="text-slate-700 text-sm sm:text-base font-medium leading-relaxed mb-4 sm:mb-5">
                  {bhajan.short_description}
                </p>
              )}

              {/* Render Lyrics using SafeHtmlContent if HTML, or formatted text preserves whitespace */}
              {bhajan.lyrics ? (
                bhajan.lyrics.includes('<') ? (
                  <SafeHtmlContent content={bhajan.lyrics} variant="lyrics" />
                ) : (
                  <div className="whitespace-pre-line text-[15px] sm:text-base font-normal text-slate-800 leading-relaxed tracking-wide font-hindi-body space-y-1">
                    {bhajan.lyrics}
                  </div>
                )
              ) : bhajan.description ? (
                <div className="whitespace-pre-line text-sm sm:text-base font-normal text-slate-800 leading-relaxed font-hindi-body">
                  {bhajan.description}
                </div>
              ) : (
                <p className="text-gray-500 italic text-sm">बोल उपलब्ध नहीं हैं।</p>
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
                className="bg-[#3D261C] rounded-xl p-5 sm:p-6 text-white shadow-lg border border-amber-900/40 relative overflow-hidden flex flex-col gap-4"
              >
                {/* Category / God Badge & Favorite Button */}
                <div className="flex items-center justify-between gap-2">
                  {bhajan.god_name || bhajan.category_name ? (
                    <div className="inline-flex items-center px-3 py-0.5 rounded-md bg-white/10 text-saffron font-bold text-xs uppercase tracking-wider self-start border border-white/10">
                      {bhajan.god_name || bhajan.category_name}
                    </div>
                  ) : (
                    <div />
                  )}

                  {favoriteItem && (
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(favoriteItem, e)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-hindi-heading flex items-center gap-1.5 transition-all cursor-pointer ${
                        hearted
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                      }`}
                      title={hearted ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${hearted ? 'fill-white text-white' : 'text-rose-400'}`} />
                      <span>{hearted ? (isHi ? 'सहेजा गया' : 'Favorited') : isHi ? 'पसंदीदा' : 'Favorite'}</span>
                    </button>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white leading-snug tracking-tight">{bhajan.title}</h3>

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
                    url={itemUrl}
                  />
                </div>
              </motion.div>

              {/* 2. Explore Deity Card (Rendered below Dark Brown Card if deity info exists) */}
              {bhajan.god_name && (
                <Link
                  to={`/gods/${bhajan.god_slug || bhajan.god_id || ''}`}
                  className="group block bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-xs hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="flex items-center gap-1.5 text-saffron font-bold text-xs uppercase tracking-wider mb-2.5">
                    <span className="text-sm">✨</span> EXPLORE DEITY
                  </div>
                  <div className="flex items-center gap-3.5 mb-3.5">
                    <img
                      src={bhajan.god_image || '/Deities/Krishna.png'}
                      alt={bhajan.god_name}
                      className="w-14 h-14 rounded-lg object-cover shadow-xs border border-amber-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base sm:text-lg font-bold text-darkBrown group-hover:text-saffron transition-colors truncate">
                        {bhajan.god_name}
                      </h4>
                    </div>
                  </div>
                  <span className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-saffron text-white rounded-lg font-bold text-xs group-hover:brightness-90 transition-colors shadow-xs">
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
