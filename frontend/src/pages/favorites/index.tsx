import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Music,
  Play,
  Scroll,
  BookOpen,
  Calendar,
  Sparkles,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Disc,
  Clock,
  Layers,
  Flame
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useFavorites, type FavoriteItem } from '@hooks/useFavorites';
import { useTranslation } from '@i18n/LanguageContext';
import { Breadcrumb } from '@components/common/Breadcrumb';
import { Button } from '@components/ui/Button';
import toast from 'react-hot-toast';

interface SectionConfig {
  type: string;
  titleHi: string;
  titleEn: string;
  subtitleHi: string;
  subtitleEn: string;
  icon: React.ReactNode;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  exploreUrl: string;
}

interface FavoriteSectionRowProps {
  config: SectionConfig;
  items: FavoriteItem[];
  isHi: boolean;
  onRemove: (item: FavoriteItem, e: React.MouseEvent) => void;
}

const FavoriteSectionRow: React.FC<FavoriteSectionRowProps> = ({ config, items, isHi, onRemove }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 350);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 sm:pb-2.5 border-b border-amber-200/80 gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white border border-amber-200 shadow-xs flex items-center justify-center shrink-0 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5">
            {config.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-900 font-hindi-heading leading-tight truncate">
              {isHi ? config.titleHi : config.titleEn}
            </h2>
            <p className="hidden sm:block text-xs md:text-sm text-slate-500 font-hindi-body truncate mt-0.5">
              {isHi ? config.subtitleHi : config.subtitleEn}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link
            to={config.exploreUrl}
            className="inline-flex items-center gap-1 px-1.5 py-1 sm:px-2.5 rounded-lg text-xs sm:text-sm font-bold text-saffron hover:text-orange-700 hover:bg-orange-50/80 transition-colors font-hindi-heading group"
            title={isHi ? 'और देखें' : 'Explore More'}
            aria-label={isHi ? 'और देखें' : 'Explore More'}
          >
            <span className="hidden sm:inline">{isHi ? 'और देखें' : 'Explore More'}</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Carousel Next / Previous Navigation Buttons */}
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-all ${
              canScrollLeft
                ? 'bg-white hover:bg-saffron text-slate-700 hover:text-white border-amber-200/90 shadow-2xs cursor-pointer'
                : 'bg-slate-100/60 text-slate-300 border-gray-200/50 cursor-not-allowed opacity-50'
            }`}
            title={isHi ? 'पिछला' : 'Previous'}
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-all ${
              canScrollRight
                ? 'bg-white hover:bg-saffron text-slate-700 hover:text-white border-amber-200/90 shadow-2xs cursor-pointer'
                : 'bg-slate-100/60 text-slate-300 border-gray-200/50 cursor-not-allowed opacity-50'
            }`}
            title={isHi ? 'अगला' : 'Next'}
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Carousel Container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory pb-2 pt-1 px-1 scrollbar-none scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.url}
            className="group relative flex flex-col justify-between bg-white hover:bg-amber-50/20 rounded-lg border border-amber-200/70 hover:border-saffron/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden isolate min-w-[270px] w-[270px] sm:min-w-[300px] sm:w-[300px] lg:min-w-[320px] lg:w-[320px] shrink-0 snap-start cursor-pointer select-none"
          >
            {/* Card Thumbnail Area */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-900 border-b border-amber-100">
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#2a1309] to-[#120803] text-amber-300">
                  {config.icon}
                  <span className="text-[11px] font-bold mt-1 text-amber-200/80 font-hindi-heading">Aradhna Marg</span>
                </div>
              )}

              {/* Top Right: Remove From Favorites Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove(item, e);
                }}
                title={isHi ? 'पसंदीदा से हटाएं' : 'Remove from favorites'}
                className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-white/95 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all shadow-md cursor-pointer group/btn"
              >
                <Heart className="w-4 h-4 fill-rose-500 group-hover/btn:fill-white transition-colors" />
              </button>

              {/* Category Badge if available */}
              {item.subtitle && (
                <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white font-medium sm:font-bold text-[10px] uppercase font-hindi-heading border border-white/10">
                  {item.subtitle}
                </div>
              )}
            </div>

            {/* Card Body */}
            <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-center">
              <h3 className="font-semibold sm:font-bold text-sm sm:text-base text-slate-900 font-hindi-heading leading-snug line-clamp-2 group-hover:text-saffron transition-colors">
                {item.title}
              </h3>
              {item.englishTitle && item.englishTitle.toLowerCase() !== item.title.toLowerCase() && (
                <p className="text-xs text-slate-500 font-sans font-normal sm:font-medium line-clamp-1 mt-1">
                  {item.englishTitle}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </motion.section>
  );
};

export const FavoritesPage: React.FC = () => {
  const { language, t } = useTranslation();
  const isHi = language === 'hi';
  const navigate = useNavigate();
  const { favorites, removeFavorite, clearAllFavorites, favoritesCount } = useFavorites();
  const [searchQuery, setSearchQuery] = useState('');

  // Section Configurations
  const sectionConfigs: Record<string, SectionConfig> = {
    bhajan: {
      type: 'bhajan',
      titleHi: 'भजन, आरती व चालीसा',
      titleEn: 'Bhajans, Aartis & Chalisas',
      subtitleHi: 'आपके द्वारा सहेजे गए पावन भजन व स्तोत्र संग्रह',
      subtitleEn: 'Your saved devotional songs and stotras',
      icon: <Music className="w-5 h-5 text-saffron" />,
      accentColor: 'border-amber-400/40',
      badgeBg: 'bg-amber-500/10 border-amber-500/30',
      badgeText: 'text-amber-700',
      exploreUrl: '/bhajans'
    },
    festival: {
      type: 'festival',
      titleHi: 'धार्मिक पर्व व व्रत तिथियां',
      titleEn: 'Festivals & Vrat Tithis',
      subtitleHi: 'आगामी व पावन त्यौहारों की सहेजी गई जानकारी',
      subtitleEn: 'Saved sacred festival dates and rituals',
      icon: <Calendar className="w-5 h-5 text-saffron fill-saffron/20" />,
      accentColor: 'border-indigo-400/40',
      badgeBg: 'bg-indigo-500/10 border-indigo-500/30',
      badgeText: 'text-indigo-700',
      exploreUrl: '/festivals'
    },
    purana: {
      type: 'purana',
      titleHi: '18 महापुराण एवं धर्मशास्त्र',
      titleEn: '18 Mahapuranas & Scriptures',
      subtitleHi: 'वेदों और महापुराणों के सहेजे गए पावन ग्रंथ',
      subtitleEn: 'Saved Vedic scriptures and Mahapuranas',
      icon: <Scroll className="w-5 h-5 text-saffron stroke-[2.2]" />,
      accentColor: 'border-orange-400/40',
      badgeBg: 'bg-orange-500/10 border-orange-500/30',
      badgeText: 'text-orange-700',
      exploreUrl: '/puranas'
    },
    video: {
      type: 'video',
      titleHi: 'भजन व कथा वीडियो',
      titleEn: 'Devotional Videos',
      subtitleHi: 'सहेजे गए पावन वीडियो एवं सत्संग प्रसंग',
      subtitleEn: 'Saved video gallery and satsang episodes',
      icon: <Play className="w-5 h-5 text-saffron fill-saffron ml-0.5" />,
      accentColor: 'border-rose-400/40',
      badgeBg: 'bg-rose-500/10 border-rose-500/30',
      badgeText: 'text-rose-700',
      exploreUrl: '/videos'
    },
    article: {
      type: 'article',
      titleHi: 'आध्यात्मिक लेख व ज्ञान',
      titleEn: 'Spiritual Articles & Wisdom',
      subtitleHi: 'धार्मिक प्रसंग, कथाएं व ज्ञान लेख',
      subtitleEn: 'Saved spiritual insights and stories',
      icon: <BookOpen className="w-5 h-5 text-saffron fill-saffron" />,
      accentColor: 'border-emerald-400/40',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
      badgeText: 'text-emerald-700',
      exploreUrl: '/articles'
    },
    deity: {
      type: 'deity',
      titleHi: 'देवी-देवता एवं स्तुति',
      titleEn: 'Revered Deities & Stutis',
      subtitleHi: 'पावन देवी-देवताओं के दर्शन व विवरण',
      subtitleEn: 'Saved deity darshan and stuti collections',
      icon: <Sparkles className="w-5 h-5 text-saffron fill-saffron" />,
      accentColor: 'border-yellow-400/40',
      badgeBg: 'bg-yellow-500/10 border-yellow-500/30',
      badgeText: 'text-yellow-700',
      exploreUrl: '/gods'
    }
  };

  // Filter items by search query
  const filteredFavorites = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return favorites;
    return favorites.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        (item.englishTitle && item.englishTitle.toLowerCase().includes(q)) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q))
      );
    });
  }, [favorites, searchQuery]);

  // Group favorites by section type
  const groupedSections = useMemo(() => {
    const groups: Record<string, FavoriteItem[]> = {};

    filteredFavorites.forEach((item) => {
      const typeKey = item.type || 'bhajan';
      if (!groups[typeKey]) {
        groups[typeKey] = [];
      }
      groups[typeKey].push(item);
    });

    // Return only section types that HAVE items
    const definedTypes = ['bhajan', 'festival', 'purana', 'video', 'article', 'deity'];
    const activeSections: { config: SectionConfig; items: FavoriteItem[] }[] = [];

    definedTypes.forEach((typeKey) => {
      if (groups[typeKey] && groups[typeKey].length > 0) {
        activeSections.push({
          config: sectionConfigs[typeKey],
          items: groups[typeKey]
        });
      }
    });

    // Catch any miscellaneous/other types
    Object.keys(groups).forEach((key) => {
      if (!definedTypes.includes(key) && groups[key].length > 0) {
        activeSections.push({
          config: {
            type: key,
            titleHi: 'अन्य संग्रह',
            titleEn: 'Other Collections',
            subtitleHi: 'सहेजी गई अन्य सामग्री',
            subtitleEn: 'Other saved items',
            icon: <Layers className="w-5 h-5 text-slate-500" />,
            accentColor: 'border-slate-300',
            badgeBg: 'bg-slate-100 border-slate-300',
            badgeText: 'text-slate-700',
            exploreUrl: '/'
          },
          items: groups[key]
        });
      }
    });

    return activeSections;
  }, [filteredFavorites]);

  const handleRemove = (item: FavoriteItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeFavorite(item.id);
    toast.success(isHi ? `"${item.title}" पसंदीदा सूची से हटाया गया` : `Removed "${item.title}" from favorites`, {
      duration: 2500
    });
  };

  const handleClearAll = () => {
    if (favoritesCount === 0) return;
    if (
      window.confirm(
        isHi ? 'क्या आप सभी पसंदीदा सामग्री हटाना चाहते हैं?' : 'Are you sure you want to clear all favorites?'
      )
    ) {
      clearAllFavorites();
      toast.success(isHi ? 'सभी पसंदीदा सामग्री सफलतापूर्वक हटा दी गई।' : 'All favorites cleared successfully.');
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pb-24 font-sans text-darkBrown">
      {/* 1. HERO HEADER */}
      <section className="relative w-full bg-gradient-to-b from-[#1c0f08] via-[#24130a] to-[#140a05] text-white pt-8 pb-14 sm:pb-16 px-4 sm:px-6 lg:px-8 border-b border-amber-900/40 overflow-hidden isolate">
        {/* Ambient Glows */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-64 bg-gradient-to-r from-amber-500/15 via-rose-500/20 to-orange-500/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-80 h-80 bg-rose-600/10 blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Breadcrumb */}
          <div className="mb-4">
            <Breadcrumb
              variant="dark"
              items={[
                { label: isHi ? 'होम' : 'Home', to: '/' },
                { label: isHi ? 'पसंदीदा संग्रह' : 'Saved Favorites' }
              ]}
            />
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight font-hindi-heading leading-tight mb-2">
                {isHi ? 'आपके पसंदीदा संग्रह' : 'Your Saved Favorites'}
              </h1>

              <p className="text-slate-300 text-sm sm:text-base max-w-2xl font-hindi-body leading-relaxed">
                {isHi
                  ? 'आपके द्वारा सहेजे गए पावन भजन, आरती, ग्रंथ, वीडियो एवं आध्यात्मिक लेख। यह संग्रह आपके ब्राउज़र में सुरक्षित है।'
                  : 'Your personal collection of saved sacred bhajans, aartis, scriptures, videos, and spiritual articles.'}
              </p>
            </div>

            {/* Quick Action Stats & Clear Button */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="h-10 px-4 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center gap-2">
                <span className="text-sm sm:text-base font-black text-amber-300 font-hindi-heading leading-none">
                  {favoritesCount}
                </span>
                <span className="text-xs sm:text-sm text-slate-200 font-semibold font-hindi-heading whitespace-nowrap leading-none">
                  {isHi ? 'सहेजी गई सामग्री' : 'Saved Items'}
                </span>
              </div>

              {favoritesCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="h-10 px-4 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 hover:text-white border border-rose-500/30 hover:border-rose-500/50 text-xs sm:text-sm font-bold font-hindi-heading flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 leading-none"
                  title={isHi ? 'सभी हटाएं' : 'Clear All'}
                >
                  <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="whitespace-nowrap leading-none">{isHi ? 'सभी हटाएं' : 'Clear All'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. SEARCH BAR & CONTROLS */}
      {favoritesCount > 2 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
          <div className="p-2 sm:p-2.5 bg-white rounded-2xl shadow-lg border border-amber-200/80 flex items-center gap-3">
            <Search className="w-5 h-5 text-saffron ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isHi ? 'पसंदीदा में खोजें (भजन, ग्रंथ, त्यौहार या लेख)...' : 'Search your favorites...'}
              className="flex-1 bg-transparent pt-2 pb-1 sm:pt-2.5 sm:pb-1.5 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 outline-none font-hindi-body leading-normal translate-y-[1px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-700 bg-slate-100 mr-1 cursor-pointer"
              >
                {isHi ? 'हटाएं' : 'Clear'}
              </button>
            )}
          </div>
        </section>
      )}

      {/* 3. FAVORITES CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 space-y-6 sm:space-y-8">
        {/* EMPTY STATE */}
        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-16 sm:py-24 px-6 text-center max-w-2xl mx-auto flex flex-col items-center bg-white rounded-xl border border-amber-200/80 shadow-sm"
          >
            <div className="w-20 h-20 rounded-2xl bg-rose-50 border border-rose-200/70 flex items-center justify-center text-rose-500 mb-6 shadow-inner">
              <Heart className="w-10 h-10" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-hindi-heading mb-6">
              {isHi ? 'कोई पसंदीदा सामग्री नहीं है' : 'Your Favorites list is empty'}
            </h2>

            {/* Quick Explore Navigation Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl">
              <Link
                to="/bhajans"
                className="px-4 py-3.5 rounded-lg bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-slate-800 font-bold text-sm font-hindi-heading flex items-center justify-center gap-2 transition-all group whitespace-nowrap"
              >
                <Music className="w-4 h-4 text-saffron group-hover:scale-110 transition-transform shrink-0" />
                <span className="whitespace-nowrap">{isHi ? 'भजन संग्रह' : 'Explore Bhajans'}</span>
              </Link>
              <Link
                to="/puranas"
                className="px-4 py-3.5 rounded-lg bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-slate-800 font-bold text-sm font-hindi-heading flex items-center justify-center gap-2 transition-all group whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform shrink-0" />
                <span className="whitespace-nowrap">{isHi ? '18 महापुराण' : '18 Puranas'}</span>
              </Link>
              <Link
                to="/festivals"
                className="px-4 py-3.5 rounded-lg bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-slate-800 font-bold text-sm font-hindi-heading flex items-center justify-center gap-2 transition-all group whitespace-nowrap"
              >
                <Calendar className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform shrink-0" />
                <span className="whitespace-nowrap">{isHi ? 'पर्व व त्यौहार' : 'Festivals'}</span>
              </Link>
            </div>
          </motion.div>
        ) : filteredFavorites.length === 0 ? (
          /* NO SEARCH MATCHES */
          <div className="py-16 text-center max-w-md mx-auto bg-white rounded-xl border border-amber-100 p-8 shadow-sm">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-slate-800 font-hindi-heading mb-1">
              {isHi ? 'कोई मेल नहीं मिला' : 'No matching items found'}
            </h3>
            <p className="text-sm text-slate-500 font-hindi-body mb-4">
              {isHi
                ? `"${searchQuery}" से मेल खाती कोई पसंदीदा सामग्री नहीं मिली।`
                : `No saved items matching "${searchQuery}".`}
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-xl bg-saffron text-white text-xs font-bold font-hindi-heading cursor-pointer hover:bg-orange-600 transition-colors"
            >
              {isHi ? 'खोज रीसेट करें' : 'Reset Search'}
            </button>
          </div>
        ) : (
          /* ONLY RENDER SECTIONS THAT HAVE FAVORITED ITEMS */
          groupedSections.map(({ config, items }) => (
            <FavoriteSectionRow key={config.type} config={config} items={items} isHi={isHi} onRemove={handleRemove} />
          ))
        )}
      </main>
    </div>
  );
};
