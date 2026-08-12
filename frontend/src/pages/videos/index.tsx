import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiClient } from '@api/client';
import { BhajanCard } from '@components/cards/BhajanCard';

export const VideosList = () => {
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
        {/* Header Section */}
        <div className="mb-10 mt-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-darkBrown tracking-tight mb-1">
            Divine <span className="text-saffron">Videos</span>
          </h1>
          <p className="text-darkBrown/60 text-lg">
            Explore our vast collection of daily bhajans, katha, and satsang videos.
          </p>
        </div>

        {/* Controls: Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-12">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 bg-white rounded-md pl-12 pr-4 outline-none border border-black/5 focus:border-saffron focus:ring-1 focus:ring-saffron shadow-sm"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer bg-white px-5 py-3 rounded-md border border-black/5 shadow-sm hover:border-saffron/30 transition-colors">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={includeShorts}
                onChange={(e) => setIncludeShorts(e.target.checked)}
              />
              <div
                className={`block w-10 h-6 rounded-full transition-colors ${includeShorts ? 'bg-saffron' : 'bg-gray-200'}`}
              ></div>
              <div
                className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${includeShorts ? 'translate-x-4' : 'translate-x-0'}`}
              ></div>
            </div>
            <span className="text-sm font-medium text-darkBrown">Include Shorts</span>
          </label>
        </div>

        {/* Grid Section */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron"></div>
          </div>
        ) : (
          <>
            {videos.length === 0 ? (
              <div className="text-center py-20 text-gray-500">No videos found matching your criteria.</div>
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
                      <BhajanCard
                        title={video.title}
                        godName={video.channel_name || 'Devotional'}
                        views={video.view_count || 0}
                        duration={video.duration || '00:00'}
                        thumbnailUrl={video.thumbnail}
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
