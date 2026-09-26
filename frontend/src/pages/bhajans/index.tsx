import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, Music, Filter } from 'lucide-react';
import { BhajanCard } from '@components/cards/BhajanCard';
import { Select } from '@components/ui/Select';
import { PublicApi } from '@api/publicApi';
import { Link } from 'react-router-dom';

export const BhajansList: React.FC = () => {
  const [bhajans, setBhajans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [deities, setDeities] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDeity, setSelectedDeity] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [cats, deits] = await Promise.all([PublicApi.getCategories(), PublicApi.getDeities()]);
        setCategories(cats || []);
        setDeities(deits || []);
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchBhajans = async () => {
      setLoading(true);
      try {
        const res = await PublicApi.getBhajans({
          page,
          limit: 12,
          search,
          category: selectedCategory,
          deity: selectedDeity,
          sort
        });
        setBhajans(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
      } catch (err) {
        console.error('Failed to fetch bhajans:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBhajans();
  }, [page, search, selectedCategory, selectedDeity, sort]);

  const deityOptions = [
    { label: 'सभी देवी-देवता', value: '' },
    ...deities.map((d) => ({ label: d.name, value: d.id }))
  ];

  const categoryOptions = [
    { label: 'सभी श्रेणियाँ', value: '' },
    ...categories.map((c) => ({ label: c.name, value: c.id }))
  ];

  const sortOptions = [
    { label: 'नवीनतम', value: 'newest' },
    { label: 'सर्वाधिक लोकप्रिय', value: 'popular' },
    { label: 'सर्वाधिक देखे गए', value: 'views' }
  ];

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-10 pb-6 border-b border-gray-200/60">
          <div className="text-left max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-darkBrown tracking-tight mb-3">
              भजन <span className="text-saffron">निर्देशिका</span>
            </h1>
            <p className="text-slate-600 text-sm sm:text-base md:text-lg font-medium leading-relaxed mb-3">
              सनातन धर्म के सभी देवी-देवताओं के पवित्र भजन, चालिसा एवं आरती का विशाल संग्रह।
            </p>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-saffron/10 text-saffron font-bold text-xs uppercase tracking-wider">
              <Music className="w-4 h-4" /> पावन भजन एवं आरती संग्रह
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 mb-10 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="भजन या देवी-देवता का नाम खोजें..."
              className="w-full pl-11 pr-4 py-2.5 bg-[#F9F7F3] rounded-lg outline-none border border-transparent focus:border-saffron text-sm font-medium text-darkBrown"
            />
          </div>

          {/* Custom Select Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 shrink-0">
              <Filter className="w-4 h-4 text-saffron" /> फिल्टर्स:
            </div>

            <div className="w-48">
              <Select
                options={deityOptions}
                value={selectedDeity}
                onChange={(val) => {
                  setSelectedDeity(val);
                  setPage(1);
                }}
                placeholder="सभी देवी-देवता"
                searchable={false}
              />
            </div>

            <div className="w-48">
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

            <div className="w-44">
              <Select
                options={sortOptions}
                value={sort}
                onChange={(val) => setSort(val)}
                placeholder="क्रमबद्ध करें"
                searchable={false}
              />
            </div>
          </div>
        </div>

        {/* Bhajans Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-saffron" />
          </div>
        ) : bhajans.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {bhajans.map((bhajan, i) => (
                <motion.div
                  key={bhajan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link to={`/bhajans/${bhajan.slug || bhajan.id}`} className="block h-full">
                    <BhajanCard
                      title={bhajan.title}
                      godName={bhajan.god_name || bhajan.category_name || 'भजन'}
                      views={bhajan.views || 0}
                      duration={bhajan.duration ? `${Math.floor(bhajan.duration / 60)} मि` : 'भजन'}
                      thumbnailUrl={bhajan.thumbnail_url}
                    />
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold text-darkBrown disabled:opacity-50 hover:bg-saffron hover:text-white hover:border-saffron transition-colors"
                >
                  पिछला
                </button>
                <span className="text-sm font-bold text-slate-600 px-3">
                  पृष्ठ {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold text-darkBrown disabled:opacity-50 hover:bg-saffron hover:text-white hover:border-saffron transition-colors"
                >
                  अगला
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 p-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-saffron">
              <Music className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-darkBrown mb-2">कोई भजन नहीं मिला</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              आपकी खोज के अनुसार कोई परिणाम प्राप्त नहीं हुआ। कृपया अन्य शब्द या फ़िल्टर का प्रयास करें।
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
