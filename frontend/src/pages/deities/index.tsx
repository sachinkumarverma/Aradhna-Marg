import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { PublicApi } from '@api/publicApi';
import { Link } from 'react-router-dom';
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

  const getDeityFallbackImage = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('ganesh')) return '/Deities/Ganesh.png';
    if (lower.includes('krishna')) return '/Deities/Krishna.png';
    if (lower.includes('durga')) return '/Deities/MataDurga.png';
    if (lower.includes('radha')) return '/Deities/Radharamanji.png';
    if (lower.includes('shiv')) return '/Deities/ShivJi.png';
    if (lower.includes('ram')) return '/Deities/Shriram.png';
    return '/Deities/Krishna.png';
  };

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Divine Hero Banner for Deities */}
        <div className="bg-gradient-to-r from-[#2C1A12] via-[#4A291A] to-[#2C1A12] rounded-3xl p-6 sm:p-10 text-amber-50 shadow-2xl border border-amber-900/50 relative overflow-hidden mb-12">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-saffron/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            {/* Left Divine Title */}
            <div className="max-w-2xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2.5 font-hindi-heading leading-tight">
                {t('navigation.gods')}
              </h1>
              <p className="text-amber-100/90 text-sm sm:text-base md:text-lg font-medium leading-relaxed font-hindi-heading">
                पावन देवी-देवताओं के दर्शन, स्तुति, आरती एवं पावन भजन संग्रह।
              </p>
            </div>

            {/* Right Top Search Bar */}
            <div className="w-full md:w-80 shrink-0">
              <div className="relative w-full shadow-lg rounded-xl bg-white/10 backdrop-blur-md border border-white/20 focus-within:border-saffron focus-within:ring-2 focus-within:ring-saffron/40 transition-all">
                <Search className="w-4 h-4 text-saffron absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="देवी-देवता खोजें..."
                  className="w-full pl-10 pr-4 pt-3 pb-2 bg-transparent outline-none text-sm font-medium text-white placeholder:text-amber-200/50 font-hindi-body"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Divine Darshan Gallery Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-saffron" />
          </div>
        ) : filteredDeities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7">
            {filteredDeities.map((deity, i) => {
              const deityName = getLocalizedField(deity, 'name') || deity.name;
              const deityImg = deity.image || getDeityFallbackImage(deityName);
              const targetUrl = `/gods/${deity.slug || deity.id}`;

              return (
                <motion.div
                  key={deity.id || deity.slug || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                >
                  <Link
                    to={targetUrl}
                    className="group block relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl border border-amber-900/20 hover:border-saffron/60 transition-all duration-300 aspect-[3/4] bg-stone-900 cursor-pointer"
                  >
                    {/* Background Image */}
                    <img
                      src={deityImg}
                      alt={deityName}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    {/* Divine Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent group-hover:from-black/95 transition-colors duration-300" />

                    {/* Card Content Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col justify-end text-white">
                      <h3 className="text-xl sm:text-2xl font-extrabold text-amber-100 group-hover:text-saffron transition-colors font-hindi-heading leading-tight mb-1">
                        {deityName}
                      </h3>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20 font-hindi-heading text-xs text-amber-200/90 font-medium">
                        <span>भजन एवं साहित्य</span>
                        <span className="inline-flex items-center text-saffron font-bold group-hover:translate-x-1 transition-transform">
                          दर्शन करें <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 p-8">
            <Sparkles className="w-12 h-12 text-saffron mx-auto mb-4" />
            <h3 className="text-xl font-bold text-darkBrown mb-2 font-hindi-heading">कोई देवी-देवता नहीं मिले</h3>
            <p className="text-slate-500 text-sm font-hindi-body">कृपया भिन्न खोज शब्द दर्ज करें।</p>
          </div>
        )}
      </div>
    </div>
  );
};
