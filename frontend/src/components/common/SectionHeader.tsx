import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from '@i18n/LanguageContext';
import { IconText } from './IconText';

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
    displaySubtitle = title;
  }

  const actionLabelKey = actionLink ? sectionHeaderKeyMap[actionLink.label] : undefined;
  const displayActionLabel = actionLink ? (actionLabelKey ? t(actionLabelKey) : actionLink.label) : '';

  return (
    <div className={`flex items-center justify-between pb-3 border-b border-gray-200/60 mb-5 ${className}`}>
      {/* Icon + Title + Subtitle */}
      <IconText
        icon={icon}
        gap="gap-2.5"
        className="min-w-0"
        text={
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-darkBrown font-hindi-heading leading-tight inline-block">
              {displayTitle}
            </h2>
            {displaySubtitle && displaySubtitle !== displayTitle && (
              <span className="text-sm sm:text-base font-semibold text-darkBrown/75 font-hindi-heading leading-tight hidden sm:inline-block">
                ({displaySubtitle})
              </span>
            )}
          </div>
        }
      />

      {/* Action Link (View All / Explore All) */}
      {actionLink && (
        <Link
          to={actionLink.to}
          className={`inline-flex items-center gap-1 text-xs font-bold transition-colors shrink-0 ${linkColor}`}
        >
          <span>{displayActionLabel}</span>
          <ChevronRight className="w-4 h-4 shrink-0" />
        </Link>
      )}
    </div>
  );
};
