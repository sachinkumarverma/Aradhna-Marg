import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, BookOpen, Filter } from 'lucide-react';
import { PublicApi } from '@api/publicApi';
import { Select } from '@components/ui/Select';
import { ArticleCard } from '@components/cards/ArticleCard';
import { ArticleCardSkeleton } from '@components/common/SkeletonLoader';
import { AdUnit } from '@components/common/AdUnit';
import { useTranslation } from '@i18n/LanguageContext';
import { IconText } from '@components/common/IconText';

export const ArticlesList: React.FC = () => {
  const { language, t, getLocalizedField } = useTranslation();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
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
          lang: language
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
  }, [page, search, selectedCategory, language]);

  const categoryOptions = [
    { label: t('common.allCategories'), value: '' },
    ...categories.map((c) => ({ label: getLocalizedField(c, 'name') || c.name, value: c.id }))
  ];

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Hero Banner with Top-Right Search & Filter Bar */}
        <div className="bg-gradient-to-r from-amber-50/70 via-white to-orange-50/50 rounded-2xl p-6 sm:p-8 border border-orange-100/80 shadow-sm relative overflow-hidden mb-10">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-saffron/5 blur-2xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            {/* Left Content */}
            <div className="text-left max-w-2xl">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-darkBrown tracking-tight mb-2.5 font-hindi-heading leading-tight whitespace-nowrap">
                {t('navigation.articles')}
              </h1>
              <p className="text-slate-600 text-sm sm:text-base md:text-lg font-medium leading-relaxed font-hindi-heading">
                {t('content.articlesSubtitle')}
              </p>
            </div>

            {/* Right Top/End Search & Filter Bar */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <div className="relative w-full sm:w-64 shadow-xs rounded-xl bg-white border border-orange-200/80 focus-within:border-saffron focus-within:ring-2 focus-within:ring-saffron/20 transition-all">
                <Search className="w-4 h-4 text-saffron absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder={t('common.searchArticles')}
                  className="w-full pl-10 pr-4 pt-3 pb-2 bg-transparent outline-none text-sm font-medium text-darkBrown placeholder:text-gray-400 font-hindi-body"
                />
              </div>

              <div className="w-full sm:w-48">
                <Select
                  options={categoryOptions}
                  value={selectedCategory}
                  onChange={(val) => {
                    setSelectedCategory(val);
                    setPage(1);
                  }}
                  placeholder={t('common.allCategories')}
                  searchable={false}
                  className="w-full text-sm font-hindi-heading"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <ArticleCardSkeleton key={n} />
            ))}
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
                    title={getLocalizedField(art, 'title') || art.displayTitle || art.title}
                    featuredImageUrl={art.featured_image_url}
                    excerpt={getLocalizedField(art, 'excerpt') || art.displayExcerpt || art.excerpt}
                    categoryName={getLocalizedField(art, 'category_name') || art.category_name}
                  />
                </motion.div>
              ))}
            </div>

            {/* Banner Ad Unit Placeholder */}
            <div className="mb-12">
              <AdUnit slot="banner" label="ADVERTISEMENT • विज्ञापन" />
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
            <h3 className="text-xl font-bold text-darkBrown mb-2 font-hindi-heading">{t('empty.noArticles')}</h3>
            <p className="text-slate-500 text-sm font-hindi-body">{t('empty.noArticlesDesc')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
