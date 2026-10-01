import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import { useTranslation } from '@i18n/LanguageContext';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  variant?: 'light' | 'dark';
}

const breadcrumbsKeyMap: Record<string, string> = {
  होम: 'breadcrumbs.home',
  Home: 'breadcrumbs.home',
  'भजन संग्रह': 'breadcrumbs.bhajans',
  Bhajans: 'breadcrumbs.bhajans',
  'धार्मिक लेख': 'breadcrumbs.articles',
  Articles: 'breadcrumbs.articles',
  'पावन त्योहार': 'breadcrumbs.festivals',
  Festivals: 'breadcrumbs.festivals',
  'पुराण संग्रह': 'breadcrumbs.puranas',
  Puranas: 'breadcrumbs.puranas',
  'Sacred Texts': 'breadcrumbs.puranas',
  'देवी-देवता': 'breadcrumbs.gods',
  Deities: 'breadcrumbs.gods',
  श्रेणियाँ: 'breadcrumbs.categories',
  Categories: 'breadcrumbs.categories',
  'दिव्य वीडियो': 'breadcrumbs.videos',
  Videos: 'breadcrumbs.videos',
  'खोज परिणाम': 'breadcrumbs.search',
  'खोजें (Explore)': 'breadcrumbs.explore',
  Explore: 'breadcrumbs.explore',
  'नियम व शर्तें': 'breadcrumbs.terms',
  'Terms of Service': 'breadcrumbs.terms',
  अस्वीकरण: 'breadcrumbs.disclaimer',
  Disclaimer: 'breadcrumbs.disclaimer',
  'गोपनीयता नीति': 'breadcrumbs.privacy',
  'Privacy Policy': 'breadcrumbs.privacy',
  'हमारे बारे में': 'breadcrumbs.about',
  'About Us': 'breadcrumbs.about',
  About: 'breadcrumbs.about'
};

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '', variant = 'light' }) => {
  const { t } = useTranslation();
  const isDark = variant === 'dark';

  const getTranslatedLabel = (label: string) => {
    const key = breadcrumbsKeyMap[label];
    return key ? t(key) : label;
  };

  return (
    <nav
      className={`inline-flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold font-hindi-heading leading-normal py-1 ${
        isDark ? 'text-slate-200' : 'text-slate-600'
      } ${className}`}
    >
      {/* Red Circular Home Icon */}
      <Link
        to="/"
        className="w-7 h-7 sm:w-8 sm:h-8 inline-flex items-center justify-center rounded-full bg-saffron text-white hover:bg-orange-600 transition-colors shadow-sm shrink-0 icon-wrapper"
        title={t('breadcrumbs.home')}
      >
        <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </Link>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const displayLabel = getTranslatedLabel(item.label);

        return (
          <React.Fragment key={idx}>
            <span className="inline-flex items-center justify-center shrink-0 icon-wrapper">
              <ChevronRight className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isDark ? 'text-white/40' : 'text-slate-300'}`} />
            </span>
            {isLast || !item.to ? (
              <span
                className={`font-bold truncate max-w-[200px] sm:max-w-xs md:max-w-md inline-flex items-center ${
                  isDark ? 'text-amber-400' : 'text-saffron'
                }`}
                title={displayLabel}
              >
                {displayLabel}
              </span>
            ) : (
              <Link
                to={item.to}
                className={`transition-colors font-medium inline-flex items-center ${
                  isDark ? 'text-slate-200 hover:text-white' : 'text-slate-600 hover:text-saffron'
                }`}
              >
                {displayLabel}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
