import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, BookOpen, Music, Download } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { BhajanCard } from '@components/cards/BhajanCard';
import { DeitiesCarousel } from '@components/common/DeitiesCarousel';
import { staggerContainer, fadeUpVariant } from '@/animations/variants';
import { apiClient } from '@api/client';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  const [bhajans, setBhajans] = useState<any[]>([]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await apiClient.get('/public/videos', { params: { limit: 8, page: 1, excludeShorts: true } });
        const data = res.data.data;
        if (data) {
          setBhajans(data);
        }
      } catch (error) {
        console.error('Failed to fetch videos:', error);
      }
    };
    fetchVideos();
  }, []);

  const heroImages = [
    '/Deities/Ganesh.png',
    '/Deities/Krishna.png',
    '/Deities/MataDurga.png',
    '/Deities/Radharamanji.png',
    '/Deities/ShivJi.png',
    '/Deities/Shriram.png'
  ];
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full relative bg-[#F9F7F3]">
      {/* 
        HERO SECTION 
        Premium full-width gradient + pattern 
      */}
      <section className="relative w-full overflow-hidden bg-black isolate aspect-[16/9] md:aspect-[21/9] lg:aspect-[16/9] mt-20 pb-16 flex items-center">
        
        {/* Background Image Carousel with Overlay */}
        {heroImages.map((img, i) => (
          <div 
            key={i}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${i === bgIndex ? 'opacity-100' : 'opacity-0'}`}
            style={{ 
              backgroundImage: `url("${img}")`,
              backgroundPosition: 'center 20%'
            }}
          ></div>
        ))}
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col justify-center h-full w-full">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-3xl"
          >
            <motion.h1 variants={fadeUpVariant} className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1] mb-4 md:mb-6">
              Find Your Favourite <br/>
              <span className="text-saffron">Bhajan & Videos</span>
            </motion.h1>

            <motion.p variants={fadeUpVariant} className="text-base sm:text-lg md:text-xl text-gray-200 mb-8 max-w-lg leading-relaxed">
              Explore a sacred collection of authentic lyrics, meanings, and spiritual verses.
            </motion.p>

            {/* Premium Search Bar */}
            <motion.div variants={fadeUpVariant} className="w-full max-w-2xl relative">
              <div className="relative flex items-center bg-white rounded-full p-2 shadow-2xl">
                <Search className="w-6 h-6 text-saffron absolute left-6" />
                <input 
                  type="text" 
                  placeholder="Search Bhajans, Chalisa..." 
                  className="w-full h-12 md:h-14 bg-transparent pl-12 pr-4 outline-none text-base md:text-lg text-darkBrown placeholder:text-gray-400 font-medium"
                />
                <Button className="h-10 md:h-12 px-6 md:px-8 rounded-full bg-saffron hover:brightness-90 text-white font-bold text-base md:text-lg shadow-md shrink-0">
                  Search
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* QUICK FEATURES SECTION */}
      <section className="py-12 bg-white relative z-20 -mt-16 rounded-t-[2.5rem] shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.3)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
            {[
              { icon: BookOpen, title: 'Pure Lyrics', desc: 'Accurate Hindi & English text' },
              { icon: Music, title: 'Listen & Watch', desc: 'Synced with YouTube videos' },
              { icon: Download, title: 'PDF Downloads', desc: 'Printable Bhajan books' }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-5 p-6 rounded-2xl bg-[#F9F7F3] border border-black/5 hover:border-saffron/30 transition-colors group cursor-default"
              >
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-saffron shadow-sm group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-darkBrown">{feature.title}</h3>
                  <p className="text-sm text-darkBrown/60">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DIVINE DEITIES SECTION */}
      <section className="py-20 bg-[#F9F7F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-extrabold text-darkBrown tracking-tight flex items-center gap-2">
              Divine <span className="text-saffron">Deities</span>
            </h2>
            <Link to="/gods">
              <Button className="hidden sm:flex bg-saffron hover:brightness-90 text-white font-bold rounded-lg shadow-md px-6">
                VIEW ALL <span className="ml-2 font-black">&gt;</span>
              </Button>
            </Link>
          </div>
          
          {/* Custom Auto-sliding Carousel */}
          <DeitiesCarousel />
        </div>
      </section>

      {/* TRENDING BHAJANS */}
      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-darkBrown tracking-tight">
              Trending <span className="text-saffron">Now</span>
            </h2>
            <p className="text-darkBrown/60 mt-2">Most loved bhajans this week</p>
          </div>
          <Link to="/videos">
            <Button className="hidden sm:flex bg-saffron hover:brightness-90 text-white font-bold rounded-lg shadow-md px-6">
              VIEW ALL <span className="ml-2 font-black">&gt;</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bhajans.length > 0 ? (
            bhajans.map((bhajan, i) => (
              <motion.div
                key={bhajan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={`/videos/${bhajan.youtube_video_id}`} className="block h-full">
                  <BhajanCard 
                    title={bhajan.title}
                    godName={bhajan.channel_name || "Devotional"}
                    views={bhajan.view_count || 0}
                    duration={bhajan.duration || "00:00"}
                    thumbnailUrl={bhajan.thumbnail}
                  />
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-4 text-center py-10 text-gray-500">
              Fetching divine melodies from YouTube...
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
