import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, BookOpen, Filter } from 'lucide-react';
import { PublicApi } from '@api/publicApi';
import { LanguageSwitcher } from '@components/common/LanguageSwitcher';
import { Select } from '@components/ui/Select';
import { ArticleCard } from '@components/cards/ArticleCard';

export const ArticlesList: React.FC = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lang, setLang] = useState('hi');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await PublicApi.getCategories();
        setCategories(cats || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const res = await PublicApi.getArticles({
          page,
          limit: 9,
          search,
          category: selectedCategory,
          lang
        });
        setArticles(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
      } catch (err) {
        console.error('Failed to fetch articles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [page, search, selectedCategory, lang]);

  const categoryOptions = [
    { label: 'सभी श्रेणियाँ', value: '' },
    ...categories.map((c) => ({ label: c.name, value: c.id }))
  ];

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Title & Language Toggle */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-10 pb-6 border-b border-gray-200/60">
          <div className="text-left max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-darkBrown tracking-tight mb-3">
              {lang === 'en' ? 'Sacred Articles & Stories' : 'धार्मिक लेख एवं कथाएँ'}
            </h1>
            <p className="text-slate-600 text-sm sm:text-base md:text-lg font-medium leading-relaxed mb-3">
              {lang === 'en'
                ? 'Explore spiritual knowledge, sacred scriptures, rituals, and philosophy.'
                : 'सनातन परंपरा, व्रत-त्यौहार, वैदिक दर्शन एवं पौराणिक कथाओं का संग्रह।'}
            </p>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-saffron/10 text-saffron font-bold text-xs uppercase tracking-wider">
              <BookOpen className="w-4 h-4" /> सनातन धर्म एवं संस्कृति
            </div>
          </div>

          <div className="shrink-0 self-start">
            <LanguageSwitcher currentLang={lang} onChange={(l) => setLang(l)} />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl p-4 md:p-5 shadow-xs border border-gray-100 mb-10 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={lang === 'en' ? 'Search articles...' : 'लेख का शीर्षक या विषय खोजें...'}
              className="w-full pl-11 pr-4 py-2.5 bg-[#F9F7F3] rounded-lg outline-none border border-transparent focus:border-saffron text-sm font-medium text-darkBrown"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Filter className="w-4 h-4 text-saffron" /> श्रेणियाँ:
            </span>
            <div className="w-56">
              <Select
                options={categoryOptions}
                value={selectedCategory}
                onChange={(val) => {
                  setSelectedCategory(val);
                  setPage(1);
                }}
                placeholder="सभी श्रेणियाँ"
                searchable={false}
              />
            </div>
          </div>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-saffron" />
          </div>
        ) : articles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {articles.map((art, i) => (
                <motion.div
                  key={art.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="h-full"
                >
                  <ArticleCard
                    id={art.id}
                    slug={art.slug}
                    title={art.displayTitle || art.title}
                    featuredImageUrl={art.featured_image_url}
                    excerpt={art.displayExcerpt || art.excerpt}
                    categoryName={art.category_name}
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
                  onClick={() => setPage((p) => p - 1)}
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
            <h3 className="text-xl font-bold text-darkBrown mb-2">कोई लेख नहीं मिला</h3>
            <p className="text-slate-500 text-sm">कृपया अन्य श्रेणी या खोज शब्द का चयन करें।</p>
          </div>
        )}
      </div>
    </div>
  );
};
