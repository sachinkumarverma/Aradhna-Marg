import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface YouTubePlayerProps {
  videoId: string;
  thumbnailUrl?: string;
  title: string;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId, thumbnailUrl, title }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="w-full aspect-video rounded-3xl overflow-hidden bg-black relative shadow-lg group">
      {!isPlaying ? (
        <div className="absolute inset-0 cursor-pointer" onClick={() => setIsPlaying(true)}>
          <img 
            src={thumbnailUrl || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
            alt={title}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl"
            >
              <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
            </motion.div>
          </div>
        </div>
      ) : (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        ></iframe>
      )}
    </div>
  );
};
