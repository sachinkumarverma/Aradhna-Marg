import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Sparkles, ArrowRight, Eye } from 'lucide-react';
import { SearchBar } from '@components/search/SearchBar';
import { useSearch, useTrendingSearches } from '@hooks/useSearch';
import { useTranslation } from '../../i18n/LanguageContext';
import { motion } from 'framer-motion';

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [page, setPage] = useState(1);
  const [sort] = useState('RELEVANCE');
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: trending = [] } = useTrendingSearches();

  // Execute search hook only if query is present
  const { data, isLoading, isError } = useSearch(query, {}, sort, page);
  const items = data?.items || [];
  const totalCount = data?.total || items.length;
  const totalPages = data?.pagination?.totalPages || 1;

  const getTargetUrl = (item: any) => {
    const slugOrId = item.slug || item.id;
    switch (item.type) {
      case 'BHAJAN':
        return `/bhajans/${slugOrId}`;
      case 'VIDEO':
        return `/videos/${slugOrId}`;
      case 'ARTICLE':
        return `/articles/${slugOrId}`;
      case 'FESTIVAL':
        return `/festivals/${slugOrId}`;
      case 'PURANA':
        return `/puranas/${slugOrId}`;
      case 'DEITY':
        return `/gods/${slugOrId}`;
      case 'CATEGORY':
        return `/categories/${slugOrId}`;
      default:
        return `/bhajans/${slugOrId}`;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'BHAJAN':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'VIDEO':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'PURANA':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'ARTICLE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'FESTIVAL':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'DEITY':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const hasSearchQuery = Boolean(query && query.trim().length > 0);

  return (
    <div className="w-full min-h-screen bg-[#FDFBF7] pt-6 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Search Hero */}
        <div className="relative overflow-hidden bg-gradient-to-b from-amber-50/90 via-orange-50/40 to-transparent rounded-3xl p-6 sm:p-10 border border-orange-100/80 shadow-xs mb-8">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-saffron/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

          <div className="max-w-3xl mx-auto text-center mb-6 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-saffron/10 text-saffron text-xs font-bold font-hindi-heading mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>संपूर्ण सनातन ज्ञान कोष एवं भक्ति साहित्य</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-darkBrown tracking-tight mb-2.5 font-hindi-heading leading-tight">
              {t('content.searchTitle')}
            </h1>
            <p className="text-slate-600 text-sm sm:text-base font-medium font-hindi-heading">
              महापुराण, दुर्लभ भजन, आरती, श्लोक, त्यौहार, कथा एवं दिव्य वीडियो खोजें
            </p>
          </div>

          <div className="max-w-3xl mx-auto relative z-10">
            <SearchBar />
          </div>
        </div>

        {/* Results Area */}
        <div className="w-full">
          {!hasSearchQuery ? (
            /* Initial Clean State: When user hasn't typed anything yet */
            <div className="text-center py-16 bg-white rounded-3xl border border-orange-100/80 p-8 max-w-2xl mx-auto shadow-xs">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-saffron text-2xl shadow-xs">
                🔍
              </div>
              <h3 className="text-2xl font-bold text-darkBrown mb-2 font-hindi-heading">
                सनातन धर्म का कोई भी विषय खोजें
              </h3>
              <p className="text-slate-500 text-sm mb-6 font-hindi-body max-w-md mx-auto leading-relaxed">
                ऊपर दिए गए सर्च बॉक्स में किसी भी पुराण (जैसे वायु पुराण, शिव पुराण), भजन, देवी-देवता, त्यौहार या लेख का
                नाम लिखें।
              </p>

              {/* Quick Search Chips */}
              {trending.length > 0 && (
                <div className="pt-5 border-t border-gray-100">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 font-hindi-heading">
                    लोकप्रिय खोजें / Popular Searches
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {trending.map((trend: string, i: number) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => navigate(`/search?q=${encodeURIComponent(trend)}`)}
                        className="px-4 py-2 bg-amber-50 hover:bg-saffron hover:text-white text-darkBrown rounded-full text-xs font-semibold transition-colors border border-amber-200/60 font-hindi-heading cursor-pointer shadow-xs"
                      >
                        {trend}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Search Query is present: Show results, skeletons, or empty state */
            <>
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-orange-100/60">
                <div className="flex items-center gap-2">
                  <span className="text-sm md:text-base font-bold text-darkBrown font-hindi-heading">
                    {isLoading ? (
                      `${t('common.loading')}...`
                    ) : (
                      <>
                        "<span className="text-darkBrown font-black">{query}</span>" के लिए{' '}
                        <span className="text-saffron font-black">{totalCount}</span> परिणाम प्राप्त हुए
                      </>
                    )}
                  </span>
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div
                      key={n}
                      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs animate-pulse flex flex-col justify-between h-56"
                    >
                      <div>
                        <div className="h-4 bg-amber-100 rounded w-24 mb-3" />
                        <div className="h-6 bg-gray-200 rounded w-4/5 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                        <div className="h-3 bg-gray-100 rounded w-2/3" />
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-20" />
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-red-100 p-8 max-w-xl mx-auto shadow-xs">
                  <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xl">
                    !
                  </div>
                  <h3 className="text-lg font-bold text-darkBrown mb-1 font-hindi-heading">
                    {t('errors.failedToLoad')}
                  </h3>
                  <p className="text-slate-500 text-xs mb-4 font-hindi-body">कृपया पुनः प्रयास करें।</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-saffron text-white rounded-xl text-xs font-bold font-hindi-heading shadow-xs hover:bg-orange-600 transition-colors cursor-pointer"
                  >
                    {t('common.retry')}
                  </button>
                </div>
              ) : items.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {items.map((item: any, i: number) => {
                      const targetUrl = getTargetUrl(item);
                      const hasEnglishSubtitle = item.title_en && item.title_en !== item.title;

                      return (
                        <motion.div
                          key={item.id || i}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <Link
                            to={targetUrl}
                            className="bg-white rounded-2xl p-5 border border-orange-100/70 hover:border-saffron/50 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group h-full cursor-pointer relative overflow-hidden"
                          >
                            <div>
                              {/* Image thumbnail or devotional gradient banner */}
                              {item.image ? (
                                <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-100 mb-4 border border-black/5 shadow-xs">
                                  <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                </div>
                              ) : (
                                <div className="h-28 w-full rounded-xl bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/50 mb-4 border border-orange-100/80 flex items-center justify-center text-4xl shadow-xs">
                                  {item.type === 'PURANA'
                                    ? '📜'
                                    : item.type === 'BHAJAN'
                                      ? '🪔'
                                      : item.type === 'VIDEO'
                                        ? '▶'
                                        : item.type === 'FESTIVAL'
                                          ? '🌸'
                                          : item.type === 'DEITY'
                                            ? '🙏'
                                            : '📖'}
                                </div>
                              )}

                              {/* Top Badge & Views */}
                              <div className="flex items-center justify-between mb-2.5">
                                <span
                                  className={`px-2.5 py-0.5 text-xs font-bold rounded-md border font-hindi-heading ${getTypeBadgeColor(item.type)}`}
                                >
                                  {item.type_label || item.type}
                                </span>
                                {item.views > 0 && (
                                  <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{item.views.toLocaleString()}</span>
                                  </span>
                                )}
                              </div>

                              {/* Title */}
                              <h3 className="text-lg font-bold text-darkBrown mb-1 group-hover:text-saffron transition-colors line-clamp-2 font-hindi-heading leading-snug">
                                {item.title}
                              </h3>

                              {/* English Subtitle if present */}
                              {hasEnglishSubtitle && (
                                <div className="text-xs font-semibold text-slate-400 mb-2 font-sans">
                                  {item.title_en}
                                </div>
                              )}

                              {/* Clean Excerpt */}
                              {item.excerpt && (
                                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4 font-hindi-body">
                                  {item.excerpt.replace(/<[^>]*>?/gm, '').trim()}
                                </p>
                              )}
                            </div>

                            {/* Card Footer Link */}
                            <div className="pt-3 border-t border-gray-100/80 flex items-center justify-between mt-2">
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-saffron group-hover:text-orange-600 font-hindi-heading">
                                <span>
                                  {item.type === 'VIDEO'
                                    ? 'वीडियो देखें (Watch)'
                                    : item.type === 'PURANA'
                                      ? 'पुराण पढ़ें (Read Purana)'
                                      : item.type === 'BHAJAN'
                                        ? 'भजन सुनें व पढ़ें (Listen & Read)'
                                        : item.type === 'FESTIVAL'
                                          ? 'त्यौहार विवरण (Festival Details)'
                                          : 'विस्तार से देखें (View Details)'}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                              </span>
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
                        className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold text-darkBrown disabled:opacity-50 hover:bg-saffron hover:text-white transition-colors cursor-pointer shadow-xs font-hindi-heading"
                      >
                        {t('common.previous')}
                      </button>
                      <span className="text-sm font-bold text-slate-600 px-3 font-hindi-body">
                        {t('common.page')} {page} / {totalPages}
                      </span>
                      <button
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold text-darkBrown disabled:opacity-50 hover:bg-saffron hover:text-white transition-colors cursor-pointer shadow-xs font-hindi-heading"
                      >
                        {t('common.next')}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 bg-white rounded-3xl border border-orange-100/80 p-8 max-w-2xl mx-auto shadow-xs">
                  <div className="w-16 h-16 bg-amber-100/70 rounded-full flex items-center justify-center mx-auto mb-4 text-saffron">
                    <SearchIcon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-darkBrown mb-2 font-hindi-heading">{t('empty.noResults')}</h3>
                  <p className="text-slate-500 text-sm mb-6 font-hindi-body max-w-md mx-auto">
                    "{query}" के लिए कोई सामग्री उपलब्ध नहीं मिली। कृपया दूसरे शब्दों या नीचे दिए गए लोकप्रिय विषयों से
                    खोजें:
                  </p>

                  {/* Quick Search Chips */}
                  {trending.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 font-hindi-heading">
                        लोकप्रिय खोजें / Popular Searches
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {trending.map((trend: string, i: number) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => navigate(`/search?q=${encodeURIComponent(trend)}`)}
                            className="px-3.5 py-1.5 bg-amber-50 hover:bg-saffron hover:text-white text-darkBrown rounded-full text-xs font-semibold transition-colors border border-amber-200/60 font-hindi-heading cursor-pointer"
                          >
                            {trend}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
