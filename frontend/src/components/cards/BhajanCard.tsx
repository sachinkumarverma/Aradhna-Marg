import React from 'react';
import { Music, Disc, ChevronRight, Heart, Calendar, FileText, Sparkles } from 'lucide-react';
import { Card } from '@components/ui/Card';
import { motion } from 'framer-motion';
import { SocialShareButtons } from '@components/common/SocialShareButtons';
import { useFavorites } from '@hooks/useFavorites';
import { useTranslation } from '@i18n/LanguageContext';

interface BhajanCardProps {
  id?: string | number;
  title: string;
  godName?: string;
  views?: number;
  duration?: string;
  thumbnailUrl?: string;
  slug?: string;
  publishDate?: string;
}

export const BhajanCard: React.FC<BhajanCardProps> = ({
  id,
  title,
  godName,
  duration,
  thumbnailUrl,
  slug,
  publishDate
}) => {
  const { t } = useTranslation();
  const shareUrl = slug ? `/bhajans/${slug}` : undefined;
  const cardId = String(id || slug || title);
  const { isFavorite, toggleFavorite } = useFavorites();
  const hearted = isFavorite(cardId);

  return (
    <Card className="group p-0 relative isolate overflow-hidden flex flex-col h-full bg-gradient-to-b from-[#FFFDF9] via-white to-[#FFF9EE] border border-amber-100/90 hover:border-saffron/60 hover:shadow-xl hover:shadow-saffron/10 hover:-translate-y-1 transition-all duration-300 rounded-xl">
      {/* Devotional Thumbnail Header */}
      <div className="relative aspect-video w-full overflow-hidden bg-amber-950/90 border-b border-amber-100/40">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-900 via-darkBrown to-amber-950">
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-saffron border border-amber-400/30 shadow-inner">
              <Disc className="w-8 h-8 animate-spin-slow text-saffron" />
            </div>
          </div>
        )}

        {/* Ambient Gradient Overlay for Devotional Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-darkBrown/90 via-darkBrown/20 to-black/30 group-hover:from-darkBrown/80 transition-colors duration-300" />

        {/* Top-Right: Favorite Button */}
        <button
          type="button"
          onClick={(e) => toggleFavorite(cardId, e)}
          title={hearted ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md backdrop-blur-md ${
            hearted
              ? 'bg-white text-rose-500 hover:bg-white scale-105'
              : 'bg-black/40 text-amber-100 hover:text-rose-400 hover:bg-black/60'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-125 ${hearted ? 'fill-rose-500 text-rose-500' : ''}`}
          />
        </button>

        {/* Center Hover Audio Action Button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1, opacity: 1 }}
            className="w-12 h-12 bg-saffron text-white rounded-full flex items-center justify-center shadow-lg shadow-saffron/40 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110"
          >
            <Disc className="w-6 h-6 animate-spin-slow text-white" />
          </motion.div>
        </div>

        {/* Bottom Thumbnail Overlay Info */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-amber-100 font-medium pointer-events-none">
          {godName ? (
            <span className="px-2 py-0.5 rounded bg-saffron/90 text-white font-bold text-[10px] tracking-wide shadow-xs">
              {godName}
            </span>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            {duration && (
              <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] text-amber-200 border border-white/10">
                {duration}
              </span>
            )}
            {publishDate && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] text-amber-200 border border-white/10">
                <Calendar className="w-2.5 h-2.5 text-saffron" />
                {new Date(publishDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Devotional Content Area */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Subtle Devotional Lyrics Indicator */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-saffron mb-1 tracking-wide">
            <Sparkles className="w-3 h-3 text-saffron" />
            <span>{t('common.listenAndRead')}</span>
          </div>

          <h3 className="font-bold text-darkBrown text-base line-clamp-2 pt-0.5 pb-0.5 leading-snug group-hover:text-saffron transition-colors font-hindi-heading">
            {title}
          </h3>
        </div>

        {/* Devotional Footer */}
        <div className="mt-4 pt-3 border-t border-amber-100/70 flex items-center justify-between gap-2">
          <SocialShareButtons
            title={title}
            excerpt={godName ? `${godName} का पावन भजन एवं आरती` : undefined}
            url={shareUrl}
          />

          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-saffron group-hover:text-amber-700 transition-colors shrink-0">
            <span>{t('common.listenAndRead')}</span>
            <span className="w-6 h-6 rounded-full bg-saffron/10 text-saffron flex items-center justify-center group-hover:bg-saffron group-hover:text-white transition-all shadow-xs">
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
