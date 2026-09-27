import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from '@i18n/LanguageContext';

interface SectionHeaderProps {
  icon?: React.ReactNode;
  title: string;
  hindiTitle?: string;
  actionLink?: {
    to: string;
    label: string;
    colorClass?: string;
  };
  className?: string;
}

const sectionHeaderKeyMap: Record<string, string> = {
  'Sacred Scriptures & Puranas': 'content.scripturesAndPuranas',
  'Related Articles & Insights': 'content.articlesAndInsights',
  'Recommended Bhajans & Videos': 'content.recommendedBhajans',
  'Related Articles': 'content.relatedArticles',
  'Related Bhajans': 'content.relatedBhajans',
  'View All Scriptures': 'common.viewAll',
  'Explore All': 'common.viewAll',
  'View All Bhajans': 'common.viewAll',
  'View All': 'common.viewAll'
};

const isDevanagariText = (text: string) => /[\u0900-\u097F]/.test(text);

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  hindiTitle,
  actionLink,
  className = ''
}) => {
  const { language, t } = useTranslation();
  const linkColor = actionLink?.colorClass || 'text-saffron hover:text-orange-600';

  // Determine localized display title & subtitle based on language mode
  const titleKey = sectionHeaderKeyMap[title];
  let displayTitle = titleKey ? t(titleKey) : title;
  let displaySubtitle = hindiTitle;

  if (language === 'hi' && hindiTitle) {
    displayTitle = hindiTitle;
    displaySubtitle = titleKey ? t(titleKey) : title;
  }

  const isDev = isDevanagariText(displayTitle);
  const titleFont = isDev ? 'font-hindi-heading leading-snug' : 'font-sans leading-none';

  const actionLabelKey = actionLink ? sectionHeaderKeyMap[actionLink.label] : undefined;
  const displayActionLabel = actionLink ? (actionLabelKey ? t(actionLabelKey) : actionLink.label) : '';

  return (
    <div className={`flex items-center justify-between pb-3 border-b border-gray-200/60 mb-5 ${className}`}>
      {/* Icon + Title + Subtitle */}
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && <div className="flex items-center justify-center shrink-0">{icon}</div>}
        <div className="flex items-center gap-2.5 min-w-0">
          <h2 className={`text-xl sm:text-2xl font-bold text-darkBrown ${titleFont} inline-block`}>{displayTitle}</h2>
          {displaySubtitle && displaySubtitle !== displayTitle && (
            <span className="text-sm sm:text-base font-semibold text-darkBrown/75 font-hindi-heading leading-none hidden sm:inline-block">
              ({displaySubtitle})
            </span>
          )}
        </div>
      </div>

      {/* Action Link (View All / Explore All) */}
      {actionLink && (
        <Link
          to={actionLink.to}
          className={`inline-flex items-center gap-1 text-xs font-bold transition-colors shrink-0 ${linkColor}`}
        >
          <span>{displayActionLabel}</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
};
