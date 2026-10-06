import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Music, Filter, Disc, Sparkles } from 'lucide-react';
import { CustomLoader } from '@components/common/CustomLoader';
import { BhajanCard } from '@components/cards/BhajanCard';
import { BhajanCardSkeleton } from '@components/common/SkeletonLoader';
import { Select } from '@components/ui/Select';
import { PublicApi } from '@api/publicApi';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from '@i18n/LanguageContext';
import { IconText } from '@components/common/IconText';

export const BhajansList: React.FC = () => {
  const { t, getLocalizedField } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bhajans, setBhajans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [deities, setDeities] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedDeity, setSelectedDeity] = useState(searchParams.get('deity') || '');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Sync URL search params if changed externally
  useEffect(() => {
    const deityFromUrl = searchParams.get('deity');
    const categoryFromUrl = searchParams.get('category');
    if (deityFromUrl !== null && deityFromUrl !== selectedDeity) {
      setSelectedDeity(deityFromUrl);
    }
    if (categoryFromUrl !== null && categoryFromUrl !== selectedCategory) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [cats, deits] = await Promise.all([PublicApi.getCategories(), PublicApi.getDeities()]);
        setCategories(cats || []);
        setDeities(deits || []);
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchBhajans = async () => {
      setLoading(true);
      try {
        const res = await PublicApi.getBhajans({
          page,
          limit: 12,
          search,
          category: selectedCategory,
          deity: selectedDeity,
          sort
        });
        setBhajans(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
      } catch (err) {
        console.error('Failed to fetch bhajans:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBhajans();
  }, [page, search, selectedCategory, selectedDeity, sort]);

  const getDeityFallbackImage = (name: string = '') => {
    const lower = name.toLowerCase();
    if (lower.includes('ganesh')) return '/Deities/Ganesh.png';
    if (lower.includes('krishna')) return '/Deities/Krishna.png';
    if (lower.includes('durga')) return '/Deities/MataDurga.png';
    if (lower.includes('radha')) return '/Deities/Radharamanji.png';
    if (lower.includes('shiv')) return '/Deities/ShivJi.png';
    if (lower.includes('ram')) return '/Deities/Shriram.png';
    if (lower.includes('hanuman')) return '/Deities/Hanuman.png';
    return '/Deities/Krishna.png';
  };

  const deityOptions = [
    { label: t('common.allDeities'), value: '' },
    ...deities.map((d) => ({ label: getLocalizedField(d, 'name') || d.name, value: d.id }))
  ];

  const categoryOptions = [
    { label: t('common.allCategories'), value: '' },
    ...categories.map((c) => ({ label: getLocalizedField(c, 'name') || c.name, value: c.id }))
  ];

  const sortOptions = [
    { label: t('common.newest'), value: 'newest' },
    { label: t('common.popular'), value: 'popular' },
    { label: t('common.views'), value: 'views' }
  ];

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Devotional Music Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#3D261C] via-[#5C3421] to-[#3D261C] p-6 sm:p-10 text-white shadow-xl mb-10 border border-amber-900/40">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none flex items-center justify-center">
            <Disc className="w-96 h-96 animate-spin-slow text-amber-200" />
          </div>

          <div className="relative z-10 max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3 font-hindi-heading leading-tight">
              {t('content.devotionalMusicDirectory')}
            </h1>

            <p className="text-amber-100/90 text-sm sm:text-base md:text-lg font-medium leading-relaxed mb-6 font-hindi-heading">
              {t('content.devotionalMusicSubtitle')}
            </p>

            {/* Quick Filter Chips with Deity Thumbnails */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedDeity('');
                  setSelectedCategory('');
                  setSearchParams({});
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                  !selectedDeity && !selectedCategory
                    ? 'bg-saffron text-white border-saffron shadow-sm'
                    : 'bg-white/10 text-amber-100 border-white/15 hover:bg-white/20'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>{t('common.all')}</span>
              </button>
              {deities.slice(0, 5).map((d) => {
                const deityName = getLocalizedField(d, 'name') || d.name || '';
                const deityImg = d.image || d.thumbnail_url || getDeityFallbackImage(d.name || '');
                const isSelected = selectedDeity === d.id;

                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setSelectedDeity(d.id);
                      setSearchParams({ deity: d.id });
                      setPage(1);
                    }}
                    className={`pl-1.5 pr-3 py-1 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-saffron text-white border-saffron shadow-sm'
                        : 'bg-white/10 text-amber-100 border-white/15 hover:bg-white/20'
                    }`}
                  >
                    <img
                      src={deityImg}
                      alt={deityName}
                      className="w-5 h-5 rounded-full object-cover border border-white/30 shrink-0 bg-white/10"
                    />
                    <span>{deityName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filter Controls Bar - Responsive layout to fit tablet and mobile without overflow */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-amber-100/80 mb-10 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full min-w-0">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t('common.searchBhajans')}
              className="w-full pl-11 pr-4 py-3 bg-[#F9F7F3] rounded-xl outline-none border border-amber-100 focus:border-saffron focus:bg-white text-sm font-medium text-darkBrown transition-all font-hindi-body"
            />
          </div>

          {/* Custom Select Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0">
            <div className="w-full lg:w-44">
              <Select
                options={deityOptions}
                value={selectedDeity}
                onChange={(val) => {
                  setSelectedDeity(val);
                  setSearchParams(val ? { deity: val } : {});
                  setPage(1);
                }}
                placeholder={t('common.allDeities')}
                searchable={false}
              />
            </div>

            <div className="w-full lg:w-44">
              <Select
                options={categoryOptions}
                value={selectedCategory}
                onChange={(val) => {
                  setSelectedCategory(val);
                  setPage(1);
                }}
                placeholder={t('common.allCategories')}
                searchable={false}
              />
            </div>

            <div className="w-full lg:w-36">
              <Select
                options={sortOptions}
                value={sort}
                onChange={(val) => setSort(val)}
                placeholder={t('common.sortBy')}
                searchable={false}
              />
            </div>
          </div>
        </div>

        {/* Bhajans Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <BhajanCardSkeleton key={n} />
            ))}
          </div>
        ) : bhajans.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {bhajans.map((bhajan, i) => (
                <motion.div
                  key={bhajan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link to={`/bhajans/${bhajan.slug || bhajan.id}`} className="block h-full">
                    <BhajanCard
                      id={bhajan.id}
                      slug={bhajan.slug}
                      title={bhajan.title}
                      englishTitle={bhajan.english_title || bhajan.title_en}
                      godName={getLocalizedField(bhajan, 'god_name') || bhajan.god_name || bhajan.category_name}
                      views={bhajan.views || 0}
                      duration={
                        bhajan.duration
                          ? `${Math.floor(bhajan.duration / 60)}: ${(bhajan.duration % 60).toString().padStart(2, '0')}`
                          : undefined
                      }
                      thumbnailUrl={bhajan.thumbnail_url}
                      publishDate={bhajan.publish_date || bhajan.published_at}
                    />
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold text-darkBrown disabled:opacity-50 hover:bg-saffron hover:text-white hover:border-saffron transition-colors shadow-xs"
                >
                  {t('common.previous')}
                </button>
                <span className="text-sm font-bold text-slate-600 px-3">
                  {t('common.page')} {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold text-darkBrown disabled:opacity-50 hover:bg-saffron hover:text-white hover:border-saffron transition-colors shadow-xs"
                >
                  {t('common.next')}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-amber-100 p-8 shadow-xs">
            <div className="w-16 h-16 bg-amber-100/70 rounded-full flex items-center justify-center mx-auto mb-4 text-saffron">
              <Music className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-darkBrown mb-2 font-hindi-heading">{t('empty.noBhajans')}</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto font-hindi-body">{t('empty.noBhajansDesc')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
