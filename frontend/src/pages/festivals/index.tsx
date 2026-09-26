import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Loader2, Search, ArrowRight, ChevronRight } from 'lucide-react';
import { PublicApi } from '@api/publicApi';
import { LanguageSwitcher } from '@components/common/LanguageSwitcher';
import { Link } from 'react-router-dom';
import { SocialShareButtons } from '@components/common/SocialShareButtons';

export const FestivalsList: React.FC = () => {
  const [festivals, setFestivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState('hi');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchFestivals = async () => {
      setLoading(true);
      try {
        const res = await PublicApi.getFestivals({ page, limit: 12, search, lang });
        setFestivals(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
      } catch (err) {
        console.error('Failed to fetch festivals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFestivals();
  }, [page, search, lang]);

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Title & Language Toggle */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-10 pb-6 border-b border-gray-200/60">
          <div className="text-left max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-darkBrown tracking-tight mb-3">
              {lang === 'en' ? 'Festivals & Vrats' : 'प्रमुख व्रत एवं त्यौहार'}
            </h1>
            <p className="text-slate-600 text-sm sm:text-base md:text-lg font-medium leading-relaxed mb-3">
              {lang === 'en'
                ? 'Discover Hindu festivals, auspicious dates, traditions, and sacred stories.'
                : 'दीपावली, जन्माष्टमी, महाशिवरात्रि, होली आदि प्रमुख त्यौहारों की पौराणिक कथा व महत्व।'}
            </p>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-saffron/10 text-saffron font-bold text-xs uppercase tracking-wider">
              <Calendar className="w-4 h-4" /> सनातन व्रत, पर्व एवं त्यौहार
            </div>
          </div>

          <div className="shrink-0 self-start">
            <LanguageSwitcher currentLang={lang} onChange={(l) => setLang(l)} />
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 mb-10 max-w-xl mx-auto">
          <div className="relative w-full">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={lang === 'en' ? 'Search festival...' : 'त्यौहार का नाम खोजें...'}
              className="w-full pl-11 pr-4 py-2.5 bg-[#F9F7F3] rounded-lg outline-none border border-transparent focus:border-saffron text-sm font-medium text-darkBrown"
            />
          </div>
        </div>

        {/* Festivals Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-saffron" />
          </div>
        ) : festivals.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {festivals.map((fest, i) => (
                <motion.div
                  key={fest.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  transition={{ duration: 0.25 }}
                  className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-saffron/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {fest.banner_image ? (
                    <div className="w-full h-48 overflow-hidden bg-gray-100">
                      <img
                        src={fest.banner_image}
                        alt={fest.displayName || fest.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-saffron">
                      <Calendar className="w-16 h-16" />
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {fest.festival_date && (
                        <span className="inline-block px-3 py-1 bg-amber-50 text-saffron text-xs font-bold rounded-full mb-3 border border-amber-200">
                          📅 {new Date(fest.festival_date).toLocaleDateString(lang === 'en' ? 'en-US' : 'hi-IN')}
                        </span>
                      )}
                      <h2 className="text-2xl font-bold text-darkBrown mb-3 hover:text-saffron transition-colors">
                        <Link to={`/festivals/${fest.slug || fest.id}`}>{fest.displayName || fest.name}</Link>
                      </h2>
                      {(fest.displayDescription || fest.short_description) && (
                        <p className="text-slate-600 text-sm line-clamp-3 mb-4 leading-relaxed">
                          {fest.displayDescription || fest.short_description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-3">
                      <SocialShareButtons
                        title={fest.displayName || fest.name}
                        excerpt={fest.displayDescription || fest.short_description}
                        url={`/festivals/${fest.slug || fest.id}`}
                      />
                      <Link
                        to={`/festivals/${fest.slug || fest.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-saffron hover:text-orange-600 transition-colors shrink-0 group/link"
                      >
                        <span>पूरा पढ़ें</span>
                        <span className="w-6 h-6 rounded-full bg-amber-50 text-saffron flex items-center justify-center group-hover/link:bg-saffron group-hover/link:text-white transition-colors shadow-xs">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold text-darkBrown disabled:opacity-50 hover:bg-saffron hover:text-white transition-colors"
                >
                  पिछला
                </button>
                <span className="text-sm font-bold text-slate-600 px-3">
                  पृष्ठ {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold text-darkBrown disabled:opacity-50 hover:bg-saffron hover:text-white transition-colors"
                >
                  अगला
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 p-8">
            <Calendar className="w-12 h-12 text-saffron mx-auto mb-4" />
            <h3 className="text-xl font-bold text-darkBrown mb-2">कोई त्यौहार नहीं मिला</h3>
            <p className="text-slate-500 text-sm">कृपया अन्य शब्द का प्रयास करें।</p>
          </div>
        )}
      </div>
    </div>
  );
};
