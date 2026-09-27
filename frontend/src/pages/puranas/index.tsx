import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Loader2, Search } from 'lucide-react';
import { PublicApi } from '@api/publicApi';
import { PuranaCard } from '@components/cards/PuranaCard';
import { useTranslation } from '@i18n/LanguageContext';

export const PuranasList: React.FC = () => {
  const { language, t, getLocalizedField } = useTranslation();
  const [puranas, setPuranas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchPuranas = async () => {
      setLoading(true);
      try {
        const res = await PublicApi.getPuranas({ page, limit: 12, search, lang: language });
        setPuranas(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
      } catch (err) {
        console.error('Failed to fetch puranas:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPuranas();
  }, [page, search, language]);

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Hero Banner with Top-Right Search Bar */}
        <div className="bg-gradient-to-r from-amber-50/70 via-white to-orange-50/50 rounded-2xl p-6 sm:p-8 border border-orange-100/80 shadow-sm relative overflow-hidden mb-10">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-saffron/5 blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 relative z-10">
            {/* Left Content */}
            <div className="text-left max-w-2xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-darkBrown tracking-tight mb-2.5 font-hindi-heading leading-tight">
                {t('navigation.puranas')}
              </h1>
              <p className="text-slate-600 text-sm sm:text-base md:text-lg font-medium leading-relaxed font-hindi-heading">
                {t('content.puranasSubtitle')}
              </p>
            </div>

            {/* Right Top/End Search Bar */}
            <div className="w-full md:w-80 shrink-0">
              <div className="relative w-full shadow-xs rounded-xl bg-white border border-orange-200/80 focus-within:border-saffron focus-within:ring-2 focus-within:ring-saffron/20 transition-all">
                <Search className="w-4 h-4 text-saffron absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder={t('common.searchPlaceholder')}
                  className="w-full pl-10 pr-4 pt-3 pb-2 bg-transparent outline-none text-sm font-medium text-darkBrown placeholder:text-gray-400 font-hindi-body"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Puranas Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-saffron" />
          </div>
        ) : puranas.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {puranas.map((puran, i) => (
                <motion.div
                  key={puran.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="h-full"
                >
                  <PuranaCard
                    id={puran.id}
                    slug={puran.slug}
                    title={getLocalizedField(puran, 'title') || puran.displayTitle || puran.title}
                    coverImage={puran.cover_image}
                    shortDescription={
                      getLocalizedField(puran, 'short_description') ||
                      puran.displayDescription ||
                      puran.short_description
                    }
                    viewCount={puran.view_count || puran.views}
                    language={puran.language}
                  />
                </motion.div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-bold text-darkBrown disabled:opacity-50 hover:bg-saffron hover:text-white transition-colors cursor-pointer"
                >
                  {t('common.previous')}
                </button>
                <span className="text-sm font-bold text-slate-600 px-3 font-hindi-body">
                  {t('common.page')} {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-bold text-darkBrown disabled:opacity-50 hover:bg-saffron hover:text-white transition-colors cursor-pointer"
                >
                  {t('common.next')}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100 p-8">
            <BookOpen className="w-12 h-12 text-saffron mx-auto mb-4" />
            <h3 className="text-xl font-bold text-darkBrown mb-2 font-hindi-heading">{t('empty.noPuranas')}</h3>
            <p className="text-slate-500 text-sm font-hindi-body">{t('empty.noResultsDesc')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
