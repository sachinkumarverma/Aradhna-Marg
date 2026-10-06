import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SocialShareButtons } from '@components/common/SocialShareButtons';
import { useTranslation } from '@i18n/LanguageContext';

interface ArticleCardProps {
  id?: string | number;
  slug?: string;
  title: string;
  featuredImageUrl?: string;
  excerpt?: string;
  categoryName?: string;
  layout?: 'grid' | 'horizontal' | 'compact';
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

export const ArticleCard: React.FC<ArticleCardProps> = ({
  id,
  slug,
  title,
  featuredImageUrl,
  excerpt,
  categoryName,
  layout = 'grid',
  className = ''
}) => {
  const { t, language } = useTranslation();
  const articleUrl = `/articles/${slug || id}`;
  const cleanExcerpt = stripHtml(excerpt);

  const formatCategoryBadge = (rawName?: string) => {
    if (!rawName) return '';
    if (rawName.includes('(') && rawName.includes(')')) {
      const match = rawName.match(/^([^(]+)\(([^)]+)\)$/);
      if (match) {
        const enPart = match[1].trim();
        const hiPart = match[2].trim();
        return language === 'hi' ? hiPart || enPart : enPart || hiPart;
      }
    }
    return rawName;
  };

  const displayCategory = formatCategoryBadge(categoryName);

  if (layout === 'horizontal') {
    return (
      <Link
        to={articleUrl}
        className={`group flex gap-4 p-4 rounded-xl bg-white hover:bg-amber-50/30 border border-gray-100 hover:border-saffron/40 shadow-xs hover:shadow-md transition-all overflow-hidden ${className}`}
      >
        {featuredImageUrl && (
          <div className="w-28 h-20 aspect-video rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-black/5">
            <img
              src={featuredImageUrl}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <h4 className="font-bold text-sm text-darkBrown group-hover:text-saffron transition-colors line-clamp-2 pt-1 pb-0.5 leading-relaxed font-hindi-body">
              {title}
            </h4>
            {cleanExcerpt && (
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-hindi-body">{cleanExcerpt}</p>
            )}
          </div>
          <span className="text-[11px] font-bold text-saffron flex items-center gap-1 mt-2">
            {t('common.readMore')} &rarr;
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={articleUrl}
      className={`group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-saffron/40 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col h-full block cursor-pointer ${className}`}
    >
      {/* Featured Image (Strict 16:9 Aspect Ratio) */}
      {featuredImageUrl && (
        <div className="w-full aspect-video overflow-hidden bg-gray-100 border-b border-black/5">
          <img
            src={featuredImageUrl}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {displayCategory && (
            <span className="inline-flex items-center px-2.5 py-1 bg-saffron/10 text-saffron text-[11px] sm:text-xs font-bold rounded-md mb-2.5 leading-normal max-w-full font-hindi-heading">
              {displayCategory}
            </span>
          )}
          <h2
            className="text-lg md:text-xl font-bold text-darkBrown mb-2 group-hover:text-saffron transition-colors font-hindi-heading pt-0.5 pb-0.5 leading-snug line-clamp-2 overflow-hidden"
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {title}
          </h2>
          {cleanExcerpt && (
            <p
              className="text-slate-600 text-xs md:text-sm mb-4 leading-normal font-hindi-body overflow-hidden"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                maxHeight: '3.6rem'
              }}
            >
              {cleanExcerpt}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-3">
          <SocialShareButtons title={title} excerpt={cleanExcerpt} url={articleUrl} />
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-saffron group-hover:text-orange-600 transition-colors shrink-0">
            <span>{t('common.readMore')}</span>
            <span className="w-6 h-6 rounded-full bg-amber-50 text-saffron flex items-center justify-center group-hover:bg-saffron group-hover:text-white transition-colors shadow-xs">
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
