import React from 'react';
import { Play, Clock, Eye } from 'lucide-react';
import { Card } from '@components/ui/Card';
import { motion } from 'framer-motion';

interface BhajanCardProps {
  title: string;
  godName?: string;
  views?: number;
  duration?: string;
  thumbnailUrl?: string;
}

export const BhajanCard: React.FC<BhajanCardProps> = ({ title, godName, views, duration, thumbnailUrl }) => {
  return (
    <Card className="group p-0 relative isolate overflow-hidden flex flex-col h-full bg-white">
      {/* Thumbnail Area */}
      <div className="relative aspect-video w-full overflow-hidden bg-cream border-b border-black/5">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-saffron/20 to-golden/10">
            <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center text-saffron/40 font-bold text-2xl shadow-inner">
              Om
            </div>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1, opacity: 1 }}
            className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-saffron shadow-lg translate-y-4 group-hover:translate-y-0 transition-all duration-300 opacity-0 group-hover:opacity-100"
          >
            <Play className="w-5 h-5 ml-1" fill="currentColor" />
          </motion.div>
        </div>

        {/* Duration Badge */}
        {duration && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-medium text-white flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {duration}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-1">
        {godName && <span className="text-xs font-semibold tracking-wider uppercase text-saffron mb-2">{godName}</span>}

        <h3 className="font-bold text-darkBrown leading-snug line-clamp-2 mb-3 group-hover:text-saffron transition-colors">
          {title}
        </h3>

        <div className="mt-auto flex items-center justify-between text-xs text-darkBrown/60">
          {views !== undefined && (
            <div className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              {new Intl.NumberFormat('en-IN').format(views)}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
