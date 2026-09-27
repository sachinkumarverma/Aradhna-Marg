import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  BookOpen,
  Music,
  Download,
  Calendar,
  ArrowRight,
  Loader2,
  ChevronRight,
  Play,
  Heart,
  Flame,
  Star,
  FileText,
  Sparkles,
  Scroll,
  BookMarked
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { BhajanCard } from '@components/cards/BhajanCard';
import { ArticleCard } from '@components/cards/ArticleCard';
import { PuranaCard } from '@components/cards/PuranaCard';
import { DeitiesCarousel } from '@components/common/DeitiesCarousel';
import { staggerContainer, fadeUpVariant } from '@/animations/variants';
import { PublicApi } from '@api/publicApi';
import { Link, useNavigate } from 'react-router-dom';
import { SocialShareButtons } from '@components/common/SocialShareButtons';
import { isShortVideo } from '@utils/videoUtils';
import { useFavorites } from '@hooks/useFavorites';
import { useTranslation } from '../../i18n/LanguageContext';
import { IconText } from '@components/common/IconText';

export const Home: React.FC = () => {
  const { t, getLocalizedField } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const res = await PublicApi.getHomeData();
        setData(res);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const heroImages = [
    '/Deities/Ganesh.png',
    '/Deities/Krishna.png',
    '/Deities/MataDurga.png',
    '/Deities/Radharamanji.png',
    '/Deities/ShivJi.png',
    '/Deities/Shriram.png'
  ];
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % heroImages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const fullVideos = (data?.featuredVideos || []).filter((v: any) => !isShortVideo(v));

  return (
    <div className="w-full relative bg-[#F9F7F3]">
      {/* 1. HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-black isolate aspect-[16/9] md:aspect-[21/9] lg:aspect-[16/9] mt-20 pb-12 flex items-center">
        {heroImages.map((img, i) => (
          <div
            key={i}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${i === bgIndex ? 'opacity-100' : 'opacity-0'}`}
            style={{
              backgroundImage: `url("${img}")`,
              backgroundPosition: 'center 20%'
            }}
          ></div>
        ))}
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col justify-center h-full w-full">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-3xl">
            <motion.h1
              variants={fadeUpVariant}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.35] mb-4 md:mb-5 font-hindi-heading"
            >
              {t('content.devotionalMusicDirectory')}
              <span className="block mt-1.5 sm:mt-2 text-saffron font-extrabold">{t('content.divineVideos')}</span>
            </motion.h1>

            <motion.p
              variants={fadeUpVariant}
              className="text-base sm:text-lg md:text-xl text-gray-200 mb-6 max-w-lg leading-relaxed font-normal font-hindi-body"
            >
              {t('content.devotionalMusicSubtitle')}
            </motion.p>

            {/* Master Search Bar */}
            <motion.form variants={fadeUpVariant} onSubmit={handleSearchSubmit} className="w-full max-w-2xl relative">
              <div className="relative flex items-center bg-white rounded-full p-2 shadow-2xl">
                <Search className="w-6 h-6 text-saffron absolute left-6 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('common.searchPlaceholder')}
                  className="w-full h-12 md:h-14 bg-transparent pl-12 pr-4 outline-none text-base md:text-lg text-darkBrown placeholder:text-gray-400 font-medium font-hindi-heading pt-2.5"
                />
                <Button
                  type="submit"
                  className="h-10 md:h-12 px-6 md:px-8 rounded-full bg-saffron hover:brightness-90 text-white font-semibold text-base md:text-lg shadow-md shrink-0 font-hindi-heading"
                >
                  {t('common.search')}
                </Button>
              </div>
            </motion.form>
          </motion.div>
        </div>
      </section>

      {/* 2. QUICK FEATURES SECTION */}
      <section className="py-6 bg-white relative z-20 -mt-12 rounded-t-xl shadow-[0_-15px_30px_-10px_rgba(0,0,0,0.2)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-8">
            {[
              { icon: BookOpen, title: t('content.lyricsAndDescription'), desc: 'Accurate text' },
              { icon: Music, title: t('common.listenAndRead'), desc: 'Synced with videos' },
              { icon: Download, title: t('common.readPdf'), desc: 'Printable Bhajan books' }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-lg bg-[#F9F7F3] border border-black/5 hover:border-saffron/30 transition-colors group cursor-default"
              >
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-saffron shadow-sm group-hover:scale-110 transition-transform icon-wrapper shrink-0">
                  <feature.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-darkBrown font-hindi-heading leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-darkBrown/60 font-hindi-body">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. COMBINED 2-COLUMN SECTION: Left (2/3) Latest Videos + Right (1/3) Trending Bhajans */}
      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 Columns = 2/3 Width): Featured / Latest Videos */}
          <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
            <div className="flex items-end justify-between mb-2">
              <div>
                <IconText
                  icon={<Play className="w-7 h-7 text-saffron fill-saffron" />}
                  gap="gap-3"
                  text={
                    <h2 className="text-2xl md:text-3xl font-bold text-darkBrown tracking-tight font-hindi-heading leading-tight translate-y-[3px]">
                      <span className="text-saffron">{t('content.divineVideos')}</span>
                    </h2>
                  }
                />
                <p className="text-darkBrown/60 text-xs md:text-sm mt-1.5 font-medium font-hindi-heading">
                  {t('content.videoCollectionSubtitle')}
                </p>
              </div>
              <Link to="/videos">
                <Button className="hidden sm:flex bg-saffron hover:brightness-90 text-white font-semibold rounded-md shadow-md px-4 py-2 text-xs font-hindi-heading">
                  {t('common.viewAll')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-saffron" />
              </div>
            ) : fullVideos.length > 0 || (data?.featuredBhajans && data.featuredBhajans.length > 0) ? (
              <div className="flex flex-col gap-5">
                {(fullVideos.length > 0 ? fullVideos : data.featuredBhajans).slice(0, 5).map((video: any) => {
                  const videoUrl = video.youtube_video_id
                    ? `/videos/${video.youtube_video_id}`
                    : `/bhajans/${video.slug || video.id}`;
                  const thumb = video.thumbnail || video.thumbnail_url || '/Deities/Krishna.png';
                  const title = video.title || video.hindi_title;
                  const subtitle = video.channel_name || video.hindi_title || 'Devotional Video';
                  const snippet = video.description || video.short_description || title;
                  const videoId = String(video.id || video.youtube_video_id || video.slug || title);
                  const isHearted = isFavorite(videoId);

                  return (
                    <motion.div
                      key={video.id || video.youtube_video_id}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -4, scale: 1.01 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.25 }}
                    >
                      <Link
                        to={videoUrl}
                        className="group block bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-xs hover:shadow-xl hover:border-saffron/40 transition-all duration-300 flex flex-col md:flex-row gap-5 items-stretch relative"
                      >
                        {/* Left Column: Video Thumbnail with Play Button & Zoom to crop black borders */}
                        <div className="relative aspect-video w-full md:w-60 lg:w-64 rounded-lg overflow-hidden bg-black shrink-0 border border-black/5">
                          <img
                            src={thumb}
                            alt={title}
                            className="w-full h-full object-cover scale-[1.12] group-hover:scale-125 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/95 text-saffron flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 ml-1 fill-current text-saffron" />
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Title, Subtitle, Quote, Badges & Action */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            {/* Top Row: Title & Heart Favorite */}
                            <div className="flex items-start justify-between gap-3 pt-1">
                              <h3 className="text-lg md:text-xl font-semibold text-darkBrown leading-relaxed line-clamp-1 group-hover:text-saffron transition-colors font-hindi-heading py-0.5">
                                {title}
                              </h3>
                              <button
                                type="button"
                                onClick={(e) => toggleFavorite(videoId, e)}
                                title={isHearted ? 'Remove from favorites' : 'Add to favorites'}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 relative z-10 ${
                                  isHearted
                                    ? 'bg-rose-50 text-rose-500 hover:bg-rose-100 shadow-xs'
                                    : 'bg-gray-50 text-gray-400 group-hover:text-rose-500 hover:bg-rose-50'
                                }`}
                              >
                                <Heart
                                  className={`w-4 h-4 transition-transform active:scale-125 ${
                                    isHearted ? 'fill-rose-500 text-rose-500' : ''
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Subtitle / Channel Name */}
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5 line-clamp-1">
                              {subtitle}
                            </p>

                            {/* Quote / Short Snippet - Strict 2 lines overflow hidden */}
                            <div className="border-l-2 border-saffron/40 pl-3 py-1 text-xs md:text-sm text-slate-600 italic line-clamp-2 overflow-hidden leading-snug max-h-[2.6rem] my-2 bg-amber-50/40 rounded-r-lg font-serif">
                              "{snippet}"
                            </div>
                          </div>

                          {/* Bottom Row: Badges on left, Social & Watch Link on right */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 mt-2">
                            <div className="flex flex-wrap items-center gap-2">
                              {(video.god_name || video.category_name) && (
                                <span className="px-2.5 py-0.5 bg-amber-50 text-saffron text-[11px] font-bold rounded-md uppercase tracking-wider border border-amber-200/60 font-hindi-heading">
                                  {video.god_name || video.category_name}
                                </span>
                              )}
                              {video.duration && (
                                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-md uppercase tracking-wider">
                                  {video.duration}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <SocialShareButtons title={title} excerpt={snippet} url={videoUrl} />
                              <div className="inline-flex items-center gap-1 text-xs font-bold text-saffron hover:text-orange-600 transition-colors shrink-0 group/link font-hindi-heading translate-y-[1.5px]">
                                <span>{t('common.watch')} &rarr;</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 font-medium bg-white rounded-xl p-6 border border-gray-100 font-hindi-heading">
                {t('empty.noVideos')}
              </div>
            )}
          </div>

          {/* Right Column (4 Columns = 1/3 Width): Trending Bhajans Sidebar */}
          <div className="lg:col-span-4 min-w-0">
            <div className="sticky top-28 bg-white rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="pb-3 border-b border-gray-100 mb-4">
                <IconText
                  icon={<Flame className="w-6 h-6 text-saffron fill-saffron" />}
                  gap="gap-2.5"
                  text={
                    <h3 className="text-xl md:text-2xl font-bold text-darkBrown tracking-tight font-hindi-heading leading-tight translate-y-[3px]">
                      <span className="text-saffron">{t('content.trendingBhajans')}</span>
                    </h3>
                  }
                />
              </div>

              {data?.featuredBhajans && data.featuredBhajans.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {data.featuredBhajans.slice(0, 6).map((bhajan: any, i: number) => {
                    const hindiTitle = bhajan.hindi_title || bhajan.title;
                    const englishTitle =
                      bhajan.english_title ||
                      bhajan.title_en ||
                      (bhajan.title && bhajan.title !== bhajan.hindi_title ? bhajan.title : '') ||
                      bhajan.god_name ||
                      bhajan.category_name ||
                      'Devotional Bhajan';

                    return (
                      <Link
                        key={bhajan.id}
                        to={`/bhajans/${bhajan.slug || bhajan.id}`}
                        className="group flex items-center gap-3 p-2 rounded-lg hover:bg-amber-50/70 transition-all border border-transparent hover:border-amber-200/50"
                      >
                        {/* Thumbnail Image */}
                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-black/5">
                          <img
                            src={bhajan.thumbnail_url || bhajan.image_url || '/Deities/Krishna.png'}
                            alt={hindiTitle}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>

                        {/* Text Details */}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs md:text-sm font-bold text-darkBrown group-hover:text-saffron transition-colors truncate font-hindi-heading">
                            {hindiTitle}
                          </h4>
                          <p className="text-[11px] font-semibold text-slate-500 truncate mt-0.5 font-hindi-body">
                            {englishTitle}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic py-4 text-center font-hindi-heading">
                  {t('empty.noBhajans')}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. SPIRITUAL ARTICLES & STORIES SECTION (1 Row of 3 Articles) */}
      {data?.featuredArticles && data.featuredArticles.length > 0 && (
        <section className="py-8 md:py-10 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-5">
              <div>
                <IconText
                  icon={<BookOpen className="w-7 h-7 text-saffron fill-saffron" />}
                  gap="gap-3"
                  text={
                    <h2 className="text-2xl md:text-3xl font-bold text-darkBrown tracking-tight font-hindi-heading leading-tight translate-y-[3px]">
                      <span className="text-saffron">{t('content.articlesAndInsights')}</span>
                    </h2>
                  }
                />
                <p className="text-darkBrown/60 text-xs md:text-sm mt-1.5 font-medium font-hindi-heading">
                  {t('content.articlesSubtitle')}
                </p>
              </div>
              <Link to="/articles">
                <Button className="hidden sm:flex bg-saffron hover:brightness-90 text-white font-semibold rounded-md shadow-md px-4 py-2 text-xs font-hindi-heading">
                  {t('common.viewAll')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.featuredArticles.slice(0, 3).map((article: any, i: number) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.25 }}
                  className="h-full"
                >
                  <ArticleCard
                    id={article.id}
                    slug={article.slug}
                    title={getLocalizedField(article, 'title')}
                    featuredImageUrl={article.featured_image_url}
                    excerpt={getLocalizedField(article, 'excerpt')}
                    categoryName={article.category_name}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. DIVINE DEITIES SECTION (Carousel using API data) */}
      <section className="py-8 md:py-10 bg-[#F9F7F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <IconText
                icon={<Sparkles className="w-7 h-7 text-saffron fill-saffron" />}
                gap="gap-3"
                text={
                  <h2 className="text-2xl md:text-3xl font-bold text-darkBrown tracking-tight font-hindi-heading leading-tight translate-y-[3px]">
                    <span className="text-saffron">{t('content.popularDeities')}</span>
                  </h2>
                }
              />
              <p className="text-darkBrown/60 text-xs md:text-sm mt-1.5 font-medium font-hindi-heading">
                {t('content.exploreSubtitle')}
              </p>
            </div>
            <Link to="/gods">
              <Button className="hidden sm:flex bg-saffron hover:brightness-90 text-white font-semibold rounded-md shadow-md px-4 py-2 text-xs font-hindi-heading">
                {t('common.viewAll')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
          <DeitiesCarousel deities={data?.deities} />
        </div>
      </section>

      {/* 6. SACRED SCRIPTURES / PURANAS SECTION */}
      {data?.puranas && data.puranas.length > 0 && (
        <section className="py-8 md:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-5">
            <div>
              <IconText
                icon={<Scroll className="w-7 h-7 text-saffron stroke-[2.2]" />}
                gap="gap-3"
                text={
                  <h2 className="text-2xl md:text-3xl font-bold text-darkBrown tracking-tight font-hindi-heading leading-tight translate-y-[3px]">
                    <span className="text-saffron">{t('content.scripturesAndPuranas')}</span>
                  </h2>
                }
              />
              <p className="text-darkBrown/60 text-xs md:text-sm mt-1.5 font-medium font-hindi-heading">
                {t('content.puranasSubtitle')}
              </p>
            </div>
            <Link to="/puranas">
              <Button className="hidden sm:flex bg-saffron hover:brightness-90 text-white font-semibold rounded-md shadow-md px-4 py-2 text-xs font-hindi-heading">
                {t('common.viewAll')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
            {data.puranas.map((puran: any, i: number) => (
              <motion.div
                key={puran.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                <PuranaCard
                  id={puran.id}
                  slug={puran.slug}
                  title={getLocalizedField(puran, 'title')}
                  coverImage={puran.cover_image}
                  shortDescription={getLocalizedField(puran, 'short_description')}
                  language={puran.language}
                  viewCount={puran.views}
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 7. MAJOR FESTIVALS & VRATS SECTION */}
      {data?.festivals && data.festivals.length > 0 && (
        <section className="py-8 md:py-10 bg-gradient-to-br from-amber-50 to-orange-50 border-t border-orange-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-5">
              <IconText
                icon={<Calendar className="w-7 h-7 text-saffron fill-saffron/20" />}
                gap="gap-3"
                text={
                  <h2 className="text-2xl md:text-3xl font-bold text-darkBrown tracking-tight font-hindi-heading leading-tight translate-y-[3px]">
                    <span className="text-saffron">{t('navigation.festivals')}</span>
                  </h2>
                }
              />
              <Link to="/festivals">
                <Button className="hidden sm:flex bg-saffron hover:brightness-90 text-white font-semibold rounded-md shadow-md px-4 py-2 text-xs font-hindi-heading">
                  {t('common.viewAll')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.festivals.map((fest: any, i: number) => {
                const festName = fest.displayName || getLocalizedField(fest, 'name');
                const festDesc = fest.displayDescription || getLocalizedField(fest, 'short_description');
                return (
                  <motion.div
                    key={fest.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.25 }}
                  >
                    <Link
                      to={`/festivals/${fest.slug || fest.id}`}
                      className="group block bg-white rounded-xl p-4 border border-orange-100/80 shadow-sm hover:shadow-xl hover:border-saffron/40 transition-all duration-300 flex items-center gap-4 cursor-pointer"
                    >
                      {fest.banner_image ? (
                        <div className="aspect-video w-20 rounded overflow-hidden shrink-0 bg-gray-100">
                          <img
                            src={fest.banner_image}
                            alt={festName}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded bg-orange-100 flex items-center justify-center text-saffron shrink-0 group-hover:scale-105 transition-transform">
                          <Calendar className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                        <div>
                          <h3 className="font-bold text-base text-darkBrown line-clamp-1 group-hover:text-saffron transition-colors font-hindi-heading">
                            {festName}
                          </h3>
                          {festDesc && (
                            <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed font-hindi-body">
                              {festDesc}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-end mt-1.5">
                          <span className="inline-flex items-center text-xs font-bold text-saffron group-hover:underline font-hindi-heading">
                            {t('common.read')}{' '}
                            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
