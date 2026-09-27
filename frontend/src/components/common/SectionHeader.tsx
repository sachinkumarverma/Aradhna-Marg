import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

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

const isDevanagariText = (text: string) => /[\u0900-\u097F]/.test(text);

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  hindiTitle,
  actionLink,
  className = ''
}) => {
  const linkColor = actionLink?.colorClass || 'text-saffron hover:text-orange-600';
  const isDev = isDevanagariText(title);
  const titleFont = isDev ? 'font-hindi-heading' : 'font-sans -translate-y-[3.5px]';

  return (
    <div className={`flex items-center justify-between pb-3 border-b border-gray-200/60 mb-5 ${className}`}>
      {/* Icon + English Title + Hindi Subtitle (Single Straight Row) */}
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && <div className="flex items-center justify-center shrink-0">{icon}</div>}
        <div className="flex items-center gap-2.5 min-w-0">
          <h2 className={`text-xl sm:text-2xl font-bold text-darkBrown ${titleFont} leading-none inline-block`}>
            {title}
          </h2>
          {hindiTitle && (
            <span className="text-sm sm:text-base font-semibold text-darkBrown/75 font-hindi-body leading-none">
              ({hindiTitle})
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
          <span>{actionLink.label}</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
};
