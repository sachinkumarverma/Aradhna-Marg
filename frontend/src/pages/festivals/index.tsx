import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, ChevronRight } from 'lucide-react';
import { CustomLoader } from '@components/common/CustomLoader';
import { PublicApi } from '@api/publicApi';
import { Link } from 'react-router-dom';
import { SocialShareButtons } from '@components/common/SocialShareButtons';
import { useTranslation } from '@i18n/LanguageContext';
import { IconText } from '@components/common/IconText';

export const FestivalsList: React.FC = () => {
  const { language, t, getLocalizedField } = useTranslation();
  const [festivals, setFestivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchFestivals = async () => {
      setLoading(true);
      try {
        const res = await PublicApi.getFestivals({ page, limit: 12, search, lang: language });
        setFestivals(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
      } catch (err) {
        console.error('Failed to fetch festivals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFestivals();
  }, [page, search, language]);

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Hero Banner with Top-Right Search Bar */}
        <div className="bg-gradient-to-r from-amber-50/70 via-white to-orange-50/50 rounded-2xl p-6 sm:p-8 border border-orange-100/80 shadow-sm relative overflow-hidden mb-10">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-saffron/5 blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 relative z-10">
            {/* Left Content */}
            <div className="text-left max-w-2xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-darkBrown tracking-tight mb-2.5 font-hindi-heading leading-tight">
                {t('navigation.festivals')}
              </h1>
              <p className="text-slate-600 text-sm sm:text-base md:text-lg font-medium leading-relaxed font-hindi-heading">
                {t('content.festivalsSubtitle')}
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

        {/* Festivals Grid */}
        {loading ? (
          <CustomLoader fullScreen />
        ) : festivals.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {festivals.map((fest, i) => {
                const festName = getLocalizedField(fest, 'name') || fest.displayName || fest.name;
                const festDesc =
                  getLocalizedField(fest, 'short_description') || fest.displayDescription || fest.short_description;
                const targetUrl = `/festivals/${fest.slug || fest.id}`;

                return (
                  <motion.div
                    key={fest.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Link
                      to={targetUrl}
                      className="group block bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-saffron/40 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between cursor-pointer"
                    >
                      <div>
                        {fest.banner_image ? (
                          <div className="w-full h-48 overflow-hidden bg-gray-100">
                            <img
                              src={fest.banner_image}
                              alt={festName}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-saffron">
                            <Calendar className="w-16 h-16" />
                          </div>
                        )}

                        <div className="p-6 pb-0">
                          {/* Title Row with Festival Name on Left & Date Badge on Right */}
                          <div className="flex items-center justify-between gap-3 mb-3 pt-1">
                            <h2 className="text-xl sm:text-2xl font-bold text-darkBrown group-hover:text-saffron transition-colors font-hindi-heading line-clamp-1 pt-1.5 pb-1 leading-snug">
                              {festName}
                            </h2>
                            {fest.festival_date && (
                              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 text-saffron text-xs font-bold rounded-full border border-amber-200 font-hindi-body shrink-0 -translate-y-1 shadow-xs">
                                <Calendar className="w-3.5 h-3.5 text-orange-600 fill-orange-500/25 shrink-0" />
                                <span className="pt-[1.5px] inline-block">
                                  {new Date(fest.festival_date).toLocaleDateString(
                                    language === 'en' ? 'en-US' : 'hi-IN'
                                  )}
                                </span>
                              </span>
                            )}
                          </div>

                          {festDesc && (
                            <p className="text-slate-600 text-sm line-clamp-3 mb-4 leading-relaxed font-hindi-body">
                              {festDesc}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="p-6 pt-3">
                        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                          <div onClick={(e) => e.stopPropagation()}>
                            <SocialShareButtons title={festName} excerpt={festDesc} url={targetUrl} />
                          </div>
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-saffron group-hover:text-orange-600 transition-colors shrink-0 font-hindi-heading">
                            <span>{t('common.readMore')}</span>
                            <span className="w-6 h-6 rounded-full bg-amber-50 text-saffron flex items-center justify-center group-hover:bg-saffron group-hover:text-white transition-colors shadow-xs">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold text-darkBrown disabled:opacity-50 hover:bg-saffron hover:text-white transition-colors"
                >
                  {t('common.previous')}
                </button>
                <span className="text-sm font-bold text-slate-600 px-3 font-hindi-body">
                  {t('common.page')} {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold text-darkBrown disabled:opacity-50 hover:bg-saffron hover:text-white transition-colors"
                >
                  {t('common.next')}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 p-8">
            <Calendar className="w-12 h-12 text-saffron mx-auto mb-4" />
            <h3 className="text-xl font-bold text-darkBrown mb-2 font-hindi-heading">{t('empty.noFestivals')}</h3>
            <p className="text-slate-500 text-sm font-hindi-body">{t('empty.noResultsDesc')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
