import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, Music, Filter, Disc, Sparkles } from 'lucide-react';
import { BhajanCard } from '@components/cards/BhajanCard';
import { Select } from '@components/ui/Select';
import { PublicApi } from '@api/publicApi';
import { Link } from 'react-router-dom';
import { useTranslation } from '@i18n/LanguageContext';
import { IconText } from '@components/common/IconText';

export const BhajansList: React.FC = () => {
  const { t, getLocalizedField } = useTranslation();
  const [bhajans, setBhajans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [deities, setDeities] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDeity, setSelectedDeity] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
    <div className="w-full min-h-screen bg-[#F9F7F3] pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Devotional Music Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#3D261C] via-[#5C3421] to-[#3D261C] p-6 sm:p-10 text-white shadow-xl mb-10 border border-amber-900/40">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none flex items-center justify-center">
            <Disc className="w-96 h-96 animate-spin-slow text-amber-200" />
          </div>

          <div className="relative z-10 max-w-3xl">
            <IconText
              icon={<Sparkles className="w-4 h-4 text-saffron" />}
              gap="gap-2"
              className="px-3.5 py-1.5 rounded-full bg-white/10 text-saffron font-bold text-xs uppercase tracking-wider mb-4 border border-white/10 font-hindi-heading"
              text={t('content.bhajanDirectoryBadge')}
            />

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-3 font-hindi-heading leading-tight">
              {t('content.devotionalMusicDirectory')}
            </h1>

            <p className="text-amber-100/90 text-sm sm:text-base md:text-lg font-medium leading-relaxed mb-6 font-hindi-heading">
              {t('content.devotionalMusicSubtitle')}
            </p>

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedDeity('');
                  setSelectedCategory('');
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  !selectedDeity && !selectedCategory
                    ? 'bg-saffron text-white border-saffron shadow-sm'
                    : 'bg-white/10 text-amber-100 border-white/15 hover:bg-white/20'
                }`}
              >
                {t('common.all')}
              </button>
              {deities.slice(0, 5).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setSelectedDeity(d.id);
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    selectedDeity === d.id
                      ? 'bg-saffron text-white border-saffron shadow-sm'
                      : 'bg-white/10 text-amber-100 border-white/15 hover:bg-white/20'
                  }`}
                >
                  {getLocalizedField(d, 'name') || d.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-amber-100 mb-10 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t('common.searchPlaceholder')}
              className="w-full pl-11 pr-4 py-2.5 bg-[#F9F7F3] rounded-xl outline-none border border-amber-100 focus:border-saffron text-sm font-medium text-darkBrown transition-colors font-hindi-body"
            />
          </div>

          {/* Custom Select Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 shrink-0">
              <Filter className="w-4 h-4 text-saffron" /> {t('common.filters')}
            </div>

            <div className="w-48">
              <Select
                options={deityOptions}
                value={selectedDeity}
                onChange={(val) => {
                  setSelectedDeity(val);
                  setPage(1);
                }}
                placeholder={t('common.allDeities')}
                searchable={false}
              />
            </div>

            <div className="w-48">
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

            <div className="w-44">
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
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-saffron" />
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
