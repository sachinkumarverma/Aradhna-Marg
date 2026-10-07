import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Eye, Heart } from 'lucide-react';
import { useTranslation } from '@i18n/LanguageContext';
import { useFavorites } from '@hooks/useFavorites';

import { IconText } from '@components/common/IconText';

interface PuranaCardProps {
  id?: string | number;
  slug?: string;
  title: string;
  coverImage?: string;
  shortDescription?: string;
  viewCount?: number;
  language?: string;
  className?: string;
}

const stripHtml = (html?: string) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
};

export const PuranaCard: React.FC<PuranaCardProps> = ({
  id,
  slug,
  title,
  coverImage,
  shortDescription,
  viewCount,
  language,
  className = ''
}) => {
  const { t } = useTranslation();
  const puranUrl = `/puranas/${slug || id}`;
  const cleanDescription = stripHtml(shortDescription);
  const cardId = String(id || slug || title);
  const { isFavorite, toggleFavorite } = useFavorites();
  const hearted = isFavorite(cardId);

  const favoriteItem = {
    id: cardId,
    type: 'purana' as const,
    title,
    thumbnailUrl: coverImage,
    url: puranUrl,
    subtitle: '18 महापुराण',
    category: 'Purana'
  };

  return (
    <div
      className={`group flex flex-col justify-between bg-white hover:bg-amber-50/40 rounded-xl p-4 border border-gray-100 hover:border-saffron/40 shadow-xs hover:shadow-md transition-all h-full relative ${className}`}
    >
      <div>
        {/* Book Cover Container (Strict 3:4 Aspect Ratio) */}
        <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-amber-50 mb-3 border border-amber-200/40">
          {coverImage ? (
            <img
              src={coverImage}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-saffron/60 p-3 text-center">
              <BookOpen className="w-10 h-10 mb-1" />
              <span className="text-xs font-bold">PDF</span>
            </div>
          )}

          <button
            type="button"
            onClick={(e) => toggleFavorite(favoriteItem, e)}
            title={hearted ? 'Remove from favorites' : 'Add to favorites'}
            className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-sm backdrop-blur-xs cursor-pointer ${
              hearted
                ? 'bg-white/95 text-rose-500 hover:bg-white'
                : 'bg-black/40 text-white hover:text-rose-500 hover:bg-white'
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 transition-transform active:scale-125 ${hearted ? 'fill-rose-500 text-rose-500' : ''}`}
            />
          </button>
        </div>

        <Link to={puranUrl} className="block">
          {/* Title */}
          <h4
            className="font-bold text-sm text-darkBrown group-hover:text-saffron transition-colors font-hindi-heading leading-snug line-clamp-1 mb-1.5 overflow-hidden"
            style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {title}
          </h4>

          {/* Short Description */}
          {cleanDescription && (
            <p
              className="text-xs text-slate-600 line-clamp-2 overflow-hidden leading-normal mb-3 font-hindi-body"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                maxHeight: '2.8em'
              }}
            >
              {cleanDescription}
            </p>
          )}
          {/* Footer */}
          <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-slate-500 font-medium mt-auto">
            <IconText icon={<Eye className="w-3.5 h-3.5 text-saffron" />} gap="gap-1" text={viewCount || 0} />
            <IconText
              icon={<BookOpen className="w-3.5 h-3.5" />}
              gap="gap-1"
              className="text-xs font-bold text-saffron group-hover:translate-x-0.5 transition-transform"
              text={t('common.readPdf')}
            />
          </div>
        </Link>
      </div>
    </div>
  );
};
