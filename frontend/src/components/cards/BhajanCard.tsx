import React from 'react';
import { Play, Clock, ChevronRight, Heart } from 'lucide-react';
import { Card } from '@components/ui/Card';
import { motion } from 'framer-motion';
import { SocialShareButtons } from '@components/common/SocialShareButtons';
import { useFavorites } from '@hooks/useFavorites';

interface BhajanCardProps {
  id?: string | number;
  title: string;
  godName?: string;
  views?: number;
  duration?: string;
  thumbnailUrl?: string;
  slug?: string;
}

export const BhajanCard: React.FC<BhajanCardProps> = ({ id, title, godName, duration, thumbnailUrl, slug }) => {
  const shareUrl = slug ? `/bhajans/${slug}` : undefined;
  const cardId = String(id || slug || title);
  const { isFavorite, toggleFavorite } = useFavorites();
  const hearted = isFavorite(cardId);

  return (
    <Card className="group p-0 relative isolate overflow-hidden flex flex-col h-full bg-white border border-gray-100 hover:border-saffron/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-xl">
      {/* Thumbnail Area */}
      <div className="relative aspect-video w-full overflow-hidden bg-cream border-b border-black/5">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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

        {/* Heart Favorite Button */}
        <button
          type="button"
          onClick={(e) => toggleFavorite(cardId, e)}
          title={hearted ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm backdrop-blur-xs ${
            hearted
              ? 'bg-white/95 text-rose-500 hover:bg-white'
              : 'bg-black/30 text-white hover:text-rose-500 hover:bg-white'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-125 ${hearted ? 'fill-rose-500 text-rose-500' : ''}`}
          />
        </button>

        {/* Duration Badge */}
        {duration && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-medium text-white flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {duration}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {godName && (
            <span className="text-xs font-semibold tracking-wider uppercase text-saffron mb-1.5 block">{godName}</span>
          )}

          <h3 className="font-bold text-darkBrown leading-snug line-clamp-2 mb-2 group-hover:text-saffron transition-colors">
            {title}
          </h3>
        </div>

        {/* Footer with Social Share on Left & Read/Listen link on Right */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <SocialShareButtons
            title={title}
            excerpt={godName ? `${godName} का पावन भजन एवं आरती` : undefined}
            url={shareUrl}
          />

          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-saffron group-hover:text-orange-600 transition-colors shrink-0">
            <span>सुनें / पढ़ें</span>
            <span className="w-6 h-6 rounded-full bg-amber-50 text-saffron flex items-center justify-center group-hover:bg-saffron group-hover:text-white transition-colors shadow-xs">
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
