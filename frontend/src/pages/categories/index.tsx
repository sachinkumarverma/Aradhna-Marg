import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, Music, BookOpen, Flame, Compass, ArrowRight, FolderKanban } from 'lucide-react';
import { PublicApi } from '@api/publicApi';
import { Link } from 'react-router-dom';
import { useTranslation } from '@i18n/LanguageContext';

export const CategoriesList: React.FC = () => {
  const { t, getLocalizedField } = useTranslation();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const cats = await PublicApi.getCategories();
        setCategories(cats || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter((cat) => {
    const name = getLocalizedField(cat, 'name') || cat.name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('भजन') || lower.includes('bhajan')) return <Music className="w-6 h-6 text-saffron" />;
    if (lower.includes('आरती') || lower.includes('aarti')) return <Flame className="w-6 h-6 text-orange-500" />;
    if (lower.includes('कथा') || lower.includes('puran') || lower.includes('ग्रंथ'))
      return <BookOpen className="w-6 h-6 text-amber-600" />;
    return <FolderKanban className="w-6 h-6 text-saffron" />;
  };

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Hero Banner for Categories */}
        <div className="bg-gradient-to-r from-amber-50/70 via-white to-orange-50/50 rounded-2xl p-6 sm:p-8 border border-orange-100/80 shadow-sm relative overflow-hidden mb-10">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-saffron/5 blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 relative z-10">
            {/* Left Content */}
            <div className="text-left max-w-2xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-darkBrown tracking-tight mb-2.5 font-hindi-heading leading-tight">
                {t('navigation.categories')}
              </h1>
              <p className="text-slate-600 text-sm sm:text-base md:text-lg font-medium leading-relaxed font-hindi-heading">
                भजन, कथा, स्तोत्र एवं पावन मंत्रों की विषय-वार संपूर्ण सूचकांक श्रेणियाँ।
              </p>
            </div>

            {/* Right Top/End Search Bar */}
            <div className="w-full md:w-80 shrink-0">
              <div className="relative w-full shadow-xs rounded-xl bg-white border border-orange-200/80 focus-within:border-saffron focus-within:ring-2 focus-within:ring-saffron/20 transition-all">
                <Search className="w-4 h-4 text-saffron absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="श्रेणी खोजें..."
                  className="w-full pl-10 pr-4 pt-3 pb-2 bg-transparent outline-none text-sm font-medium text-darkBrown placeholder:text-gray-400 font-hindi-body"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Categories Directory Layout */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-saffron" />
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((cat, i) => {
              const catName = getLocalizedField(cat, 'name') || cat.name;
              const catDesc = getLocalizedField(cat, 'description') || cat.description;
              const catImg = cat.image_url || cat.icon_url;

              return (
                <motion.div
                  key={cat.id || cat.slug || i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                >
                  <Link
                    to={`/categories/${cat.slug || cat.id}`}
                    className="group block bg-white rounded-2xl p-6 border border-orange-100 shadow-xs hover:shadow-xl hover:border-saffron/50 transition-all duration-300 h-full flex flex-col justify-between cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      {/* Left Icon / Image Portal */}
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-amber-50/80 border border-amber-200/80 p-2.5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                        {catImg ? (
                          <img src={catImg} alt={catName} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          getCategoryIcon(catName)
                        )}
                      </div>

                      {/* Right Title & Description */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-darkBrown group-hover:text-saffron transition-colors font-hindi-heading leading-tight mb-1.5">
                          {catName}
                        </h3>
                        {catDesc ? (
                          <p className="text-xs text-slate-600 font-hindi-body line-clamp-2 leading-relaxed">
                            {catDesc}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500 font-hindi-body italic">समस्त पावन संग्रह एवं साहित्य</p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Link Bar */}
                    <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-gray-100/80 font-hindi-heading">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-saffron transition-colors">
                        Explore Portal
                      </span>
                      <span className="inline-flex items-center text-xs font-bold text-saffron group-hover:translate-x-1 transition-transform">
                        देखें <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 p-8">
            <Compass className="w-12 h-12 text-saffron mx-auto mb-4" />
            <h3 className="text-xl font-bold text-darkBrown mb-2 font-hindi-heading">कोई श्रेणी नहीं मिली</h3>
            <p className="text-slate-500 text-sm font-hindi-body">कृपया भिन्न खोज शब्द दर्ज करें।</p>
          </div>
        )}
      </div>
    </div>
  );
};
