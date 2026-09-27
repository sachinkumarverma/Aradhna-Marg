import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { PublicApi } from '@api/publicApi';
import { DeityCard } from '@components/cards/DeityCard';
import { useTranslation } from '@i18n/LanguageContext';

export const DeitiesList: React.FC = () => {
  const { t, getLocalizedField } = useTranslation();
  const [deities, setDeities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchDeities = async () => {
      setLoading(true);
      try {
        const deits = await PublicApi.getDeities();
        setDeities(deits || []);
      } catch (err) {
        console.error('Failed to fetch deities:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDeities();
  }, []);

  const filteredDeities = deities.filter((deity) => {
    const name = getLocalizedField(deity, 'name') || deity.name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

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
                {t('navigation.gods')}
              </h1>
              <p className="text-slate-600 text-sm sm:text-base md:text-lg font-medium leading-relaxed font-hindi-heading">
                पावन देवी-देवता दर्शन एवं उनके पावन भजन, आरती व कथा संग्रह
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
                  placeholder={t('common.searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2.5 bg-transparent outline-none text-sm font-medium text-darkBrown placeholder:text-gray-400 font-hindi-body"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Deities Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-saffron" />
          </div>
        ) : filteredDeities.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredDeities.map((deity, i) => (
              <motion.div
                key={deity.id || deity.slug || deity.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <DeityCard
                  id={deity.id}
                  slug={deity.slug}
                  name={getLocalizedField(deity, 'name') || deity.name}
                  image={deity.image}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100 p-8">
            <Sparkles className="w-12 h-12 text-saffron mx-auto mb-4" />
            <h3 className="text-xl font-bold text-darkBrown mb-2 font-hindi-heading">कोई देवी-देवता नहीं मिले</h3>
            <p className="text-slate-500 text-sm font-hindi-body">कृपया भिन्न खोज शब्द दर्ज करें।</p>
          </div>
        )}
      </div>
    </div>
  );
};
