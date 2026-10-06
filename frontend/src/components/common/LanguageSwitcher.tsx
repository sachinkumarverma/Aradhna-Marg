import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from '@i18n/LanguageContext';

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
      className={`px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-darkBrown font-bold text-xs flex items-center gap-1.5 transition-colors border border-amber-200/80 shadow-2xs cursor-pointer ${className}`}
      title={language === 'hi' ? 'Switch to English' : 'हिंदी भाषा चुनें'}
    >
      <Globe className="w-3.5 h-3.5 text-saffron shrink-0" />
      <span className="inline-block">{language === 'hi' ? 'हिंदी' : 'English'}</span>
    </button>
  );
};
