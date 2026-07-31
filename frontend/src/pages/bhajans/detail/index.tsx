import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Home, FileText } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { BhajanHero } from './components/BhajanHero';
import { LyricsViewer } from './components/LyricsViewer';
import { YouTubePlayer } from './components/YouTubePlayer';
import { useClipboard } from '../../../hooks/useClipboard';
import { apiClient } from '../../../api/client';

export const BhajanDetail: React.FC = () => {
  const { slug } = useParams(); // URL slug parameter
  const [bhajan, setBhajan] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchBhajan = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/v1/public/videos/${slug}`);
        if (res.data.data) {
          setBhajan(res.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch bhajan/video detail:', error);
      }
      setLoading(false);
    };
    if (slug) fetchBhajan();
  }, [slug]);

  const { copied, copyToClipboard } = useClipboard();

  const handleCopy = () => copyToClipboard(bhajan?.lyrics || bhajan?.description || '');

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#F9F7F3]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron"></div>
      </div>
    );
  }

  if (!bhajan) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#F9F7F3]">
        <h2 className="text-2xl font-bold text-darkBrown">Bhajan not found.</h2>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pb-24">

      {/* Main Container */}
      <div className="mx-auto w-full max-w-7xl pt-24 px-4 sm:px-6 lg:px-8">

        {/* Modern Icon-led Breadcrumbs */}
        <nav className="flex flex-wrap items-center gap-3 md:gap-2 text-[14px] md:text-[15px] font-semibold text-slate-500 mb-10 mt-4 md:mt-6 px-1 md:px-2">
          
          {/* Circular Home Icon */}
          <Link to="/" className="w-8 h-8 md:w-9 md:h-9 shrink-0 flex items-center justify-center rounded-full bg-saffron text-white hover:bg-orange-600 transition-colors shadow-sm">
            <Home className="w-4 h-4 md:w-[18px] md:h-[18px]" strokeWidth={2.5} />
          </Link>
          
          <ChevronRight className="w-4 h-4 text-slate-300" strokeWidth={2.5} />
          
          <Link to="/" className="hover:text-saffron transition-colors">Home</Link>
          
          <ChevronRight className="w-4 h-4 text-slate-300" strokeWidth={2.5} />
          
          <Link to="/videos" className="hover:text-saffron transition-colors">Videos</Link>
          
          <ChevronRight className="w-4 h-4 text-slate-300" strokeWidth={2.5} />
          
          <span className="text-saffron font-bold">{bhajan.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-10">

          {/* LEFT COLUMN: Video Player (Bigger Area) */}
          <div className="flex-1 w-full max-w-4xl mx-auto space-y-8">
            <YouTubePlayer
              videoId={bhajan.youtube_video_id}
              title={bhajan.title}
            />

            {/* Ad Placeholder */}
            <div className="mt-8 w-full h-[150px] bg-gray-200 border border-gray-300 border-dashed rounded-2xl flex items-center justify-center text-gray-400">
              Advertisement Area
            </div>
          </div>

          {/* RIGHT COLUMN: Details / Description (Smaller Area) */}
          <div className="w-full lg:w-[420px] shrink-0 flex flex-col gap-7">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, ease: "easeOut" }}
            >
              <BhajanHero
                title={bhajan.title}
                godName={bhajan.god_id || "Devotional"}
                views={bhajan.views}
                duration={
                  bhajan.is_string_duration
                    ? bhajan.string_duration
                    : bhajan.duration
                    ? `${Math.floor(bhajan.duration / 60).toString().padStart(2, '0')}:${(bhajan.duration % 60).toString().padStart(2, '0')}`
                    : "00:00"
                }
                publishDate={bhajan.published_date}
              />
            </motion.div>

            {/* The Description Container */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: 0.3, ease: "easeOut" }}
              className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl shadow-lg shadow-blue-900/5 border border-blue-100 p-6 md:p-8 mb-12 h-auto flex flex-col"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
              
              <h3 className="text-xl font-extrabold text-slate-800 mb-4 flex items-center gap-2 relative z-10">
                <FileText className="w-5 h-5 text-blue-500" /> Description
              </h3>
              
              <div className="w-full h-[2px] bg-gradient-to-r from-blue-200 to-transparent mb-6 relative z-10"></div>
              
              <div className="text-slate-700 leading-relaxed font-medium relative z-10">
                <LyricsViewer
                  lyrics={bhajan.description || 'No description provided.'}
                  fontSize={15}
                  isDark={false}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      {/* We are removing StickyBottomBar here because this is for Videos, not reading mode */}
    </div>
  );
};
