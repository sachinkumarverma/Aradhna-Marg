import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Eye, FileText } from 'lucide-react';
import { useTranslation } from '@i18n/LanguageContext';

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

  return (
    <Link
      to={puranUrl}
      className={`group flex flex-col justify-between bg-white hover:bg-amber-50/40 rounded-xl p-4 border border-gray-100 hover:border-saffron/40 shadow-xs hover:shadow-md transition-all h-full ${className}`}
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
        </div>

        {/* Title */}
        <h4 className="font-bold text-sm text-darkBrown group-hover:text-saffron transition-colors line-clamp-2 pt-1 pb-0.5 leading-relaxed font-hindi-body mb-1">
          {title}
        </h4>

        {/* Short Description */}
        {cleanDescription && (
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3 font-hindi-body">{cleanDescription}</p>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-slate-500 font-medium mt-2">
        <IconText icon={<Eye className="w-3.5 h-3.5 text-saffron" />} gap="gap-1" text={viewCount || 0} />
        <IconText
          icon={<BookOpen className="w-3.5 h-3.5" />}
          gap="gap-1"
          className="text-xs font-bold text-saffron group-hover:translate-x-0.5 transition-transform"
          text={t('common.readPdf')}
        />
      </div>
    </Link>
  );
};
