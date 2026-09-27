import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Loader2, Search } from 'lucide-react';
import { PublicApi } from '@api/publicApi';
import { LanguageSwitcher } from '@components/common/LanguageSwitcher';
import { PuranaCard } from '@components/cards/PuranaCard';

export const PuranasList: React.FC = () => {
  const [puranas, setPuranas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState('hi');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchPuranas = async () => {
      setLoading(true);
      try {
        const res = await PublicApi.getPuranas({ page, limit: 12, search, lang });
        setPuranas(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
      } catch (err) {
        console.error('Failed to fetch puranas:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPuranas();
  }, [page, search, lang]);

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Title & Language Toggle */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-10 pb-6 border-b border-gray-200/60">
          <div className="text-left max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-darkBrown tracking-tight mb-3">
              {lang === 'en' ? 'Sacred Scriptures & Puranas' : 'अष्टादश पुराण एवं महाग्रंथ'}
            </h1>
            <p className="text-slate-600 text-sm sm:text-base md:text-lg font-medium leading-relaxed mb-3">
              {lang === 'en'
                ? 'Read and download authentic 18 Puranas, Bhagavad Gita, Ramayana, and sacred texts in PDF.'
                : 'श्रीमद्भागवत, विष्णु, शिव, अग्नि पुराण तथा भगवद्गीता सहित समस्त पवित्र ग्रंथों की PDF डिजिटल लाइब्रेरी।'}
            </p>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-saffron/10 text-saffron font-bold text-xs uppercase tracking-wider">
              <BookOpen className="w-4 h-4" /> सनातन ग्रंथ एवं अष्टादश पुराण
            </div>
          </div>

          <div className="shrink-0 self-start">
            <LanguageSwitcher currentLang={lang} onChange={(l) => setLang(l)} />
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl p-4 md:p-5 shadow-xs border border-gray-100 mb-10 max-w-xl mx-auto">
          <div className="relative w-full">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={lang === 'en' ? 'Search scripture...' : 'पुराण का नाम खोजें...'}
              className="w-full pl-11 pr-4 py-2.5 bg-[#F9F7F3] rounded-lg outline-none border border-transparent focus:border-saffron text-sm font-medium text-darkBrown"
            />
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
                    title={puran.displayTitle || puran.title}
                    coverImage={puran.cover_image}
                    shortDescription={puran.displayDescription || puran.short_description}
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
                  पिछला
                </button>
                <span className="text-sm font-bold text-slate-600 px-3">
                  पृष्ठ {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-bold text-darkBrown disabled:opacity-50 hover:bg-saffron hover:text-white transition-colors cursor-pointer"
                >
                  अगला
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100 p-8">
            <BookOpen className="w-12 h-12 text-saffron mx-auto mb-4" />
            <h3 className="text-xl font-bold text-darkBrown mb-2">कोई ग्रंथ नहीं मिला</h3>
            <p className="text-slate-500 text-sm">कृपया अन्य शब्द का प्रयोग करें।</p>
          </div>
        )}
      </div>
    </div>
  );
};
