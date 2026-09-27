import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiClient } from '@api/client';
import { VideoCard } from '@components/cards/VideoCard';
import { useTranslation } from '../../i18n/LanguageContext';

export const VideosList = () => {
  const { t } = useTranslation();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [includeShorts, setIncludeShorts] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const params: Record<string, any> = { limit: 1000, page: 1 };
        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (!includeShorts) params.excludeShorts = true;

        const res = await apiClient.get('/public/videos', { params });
        const data = res.data.data || [];
        setVideos(data);
      } catch (err) {
        console.error('Error fetching videos:', err);
      }
      setLoading(false);
    };

    const debounceTimeout = setTimeout(fetchVideos, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, includeShorts]);

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Hero Banner for Divine Videos */}
        <div className="bg-gradient-to-r from-amber-50/70 via-white to-orange-50/50 rounded-2xl p-6 sm:p-8 border border-orange-100/80 shadow-sm relative overflow-hidden mb-10 mt-4">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-saffron/5 blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 relative z-10">
            {/* Left Content */}
            <div className="text-left max-w-2xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-darkBrown tracking-tight mb-2.5 font-hindi-heading leading-tight">
                {t('content.divineVideos')}
              </h1>
              <p className="text-slate-600 text-sm sm:text-base md:text-lg font-medium leading-relaxed font-hindi-heading">
                {t('content.videoCollectionSubtitle')}
              </p>
            </div>

            {/* Right Top/End Controls */}
            <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <div className="relative w-full md:w-72 shadow-xs rounded-xl bg-white border border-orange-200/80 focus-within:border-saffron focus-within:ring-2 focus-within:ring-saffron/20 transition-all">
                <Search className="w-4 h-4 text-saffron absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t('common.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 pt-3 pb-2 bg-transparent outline-none text-sm font-medium text-darkBrown placeholder:text-gray-400 font-hindi-body"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer bg-white px-4 py-2.5 rounded-xl border border-orange-200/80 shadow-xs hover:border-saffron/30 transition-colors shrink-0">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={includeShorts}
                    onChange={(e) => setIncludeShorts(e.target.checked)}
                  />
                  <div
                    className={`block w-9 h-5 rounded-full transition-colors ${includeShorts ? 'bg-saffron' : 'bg-gray-200'}`}
                  ></div>
                  <div
                    className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${includeShorts ? 'translate-x-4' : 'translate-x-0'}`}
                  ></div>
                </div>
                <span className="text-xs font-bold text-darkBrown font-hindi-heading">
                  {t('content.includeShorts')}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Grid Section */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron"></div>
          </div>
        ) : (
          <>
            {videos.length === 0 ? (
              <div className="text-center py-20 text-gray-500">{t('empty.noVideos')}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {videos.map((video, i) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link to={`/videos/${video.youtube_video_id}`} className="block h-full">
                      <VideoCard
                        title={video.title}
                        godName={video.channel_name || 'Devotional'}
                        views={video.view_count || 0}
                        duration={video.duration || '00:00'}
                        thumbnailUrl={video.thumbnail}
                        publishDate={video.published_at}
                      />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
