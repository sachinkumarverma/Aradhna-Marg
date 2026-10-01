import React from 'react';
import { Play, Clock, ChevronRight, Heart, Eye } from 'lucide-react';
import { Card } from '@components/ui/Card';
import { motion } from 'framer-motion';
import { SocialShareButtons } from '@components/common/SocialShareButtons';
import { useFavorites } from '@hooks/useFavorites';
import { useTranslation } from '@i18n/LanguageContext';

interface VideoCardProps {
  id?: string | number;
  title: string;
  godName?: string;
  views?: number;
  duration?: string;
  thumbnailUrl?: string;
  slug?: string;
  publishDate?: string;
}

import { IconText } from '@components/common/IconText';

export const VideoCard: React.FC<VideoCardProps> = ({
  id,
  title,
  godName,
  views,
  duration,
  thumbnailUrl,
  slug,
  publishDate
}) => {
  const { t } = useTranslation();
  const shareUrl = slug ? `/videos/${slug}` : undefined;
  const cardId = String(id || slug || title);
  const { isFavorite, toggleFavorite } = useFavorites();
  const hearted = isFavorite(cardId);

  return (
    <Card className="group p-0 relative isolate overflow-hidden flex flex-col h-full bg-white border border-gray-100 hover:border-saffron/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-xl">
      {/* Thumbnail Area */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-900 border-b border-black/5">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400 font-bold text-lg font-hindi-heading">
            Divine Video
          </div>
        )}

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0.8 }}
            whileHover={{ scale: 1.1, opacity: 1 }}
            className="w-12 h-12 bg-red-600/90 group-hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 icon-wrapper"
          >
            <Play className="w-5 h-5 ml-0.5 fill-white text-white" />
          </motion.div>
        </div>

        {/* Favorite Button */}
        <button
          type="button"
          onClick={(e) => toggleFavorite(cardId, e)}
          title={hearted ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm backdrop-blur-xs icon-wrapper ${
            hearted
              ? 'bg-white/95 text-rose-500 hover:bg-white'
              : 'bg-black/40 text-white hover:text-rose-500 hover:bg-white'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-125 ${hearted ? 'fill-rose-500 text-rose-500' : ''}`}
          />
        </button>

        {/* Duration Badge */}
        {duration && (
          <IconText
            icon={<Clock className="w-3 h-3 text-red-400" />}
            gap="gap-1"
            className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 backdrop-blur-xs rounded text-[11px] font-mono text-white"
            text={duration}
          />
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-1 justify-between bg-white">
        <div>
          {godName && (
            <span className="text-xs font-bold tracking-wider uppercase text-slate-500 mb-1 block font-hindi-heading">
              {godName}
            </span>
          )}

          <h3 className="font-semibold text-darkBrown line-clamp-2 pt-1 pb-0.5 leading-snug mb-2 group-hover:text-saffron transition-colors font-hindi-heading">
            {title}
          </h3>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {views !== undefined && views > 0 && (
              <IconText icon={<Eye className="w-3.5 h-3.5 text-slate-400" />} gap="gap-1" text={views} />
            )}
          </div>

          <IconText
            icon={<ChevronRight className="w-3.5 h-3.5" />}
            iconPosition="right"
            gap="gap-1"
            align="center"
            className="text-xs font-bold text-saffron group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all shrink-0 font-hindi-heading"
            text={<span>{t('common.watch')}</span>}
          />
        </div>
      </div>
    </Card>
  );
};
