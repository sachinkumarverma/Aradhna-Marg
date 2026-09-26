import React from 'react';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  currentLang: string;
  onChange: (lang: string) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ currentLang, onChange }) => {
  return (
    <div className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full p-1 shadow-sm">
      <Globe className="w-4 h-4 text-saffron ml-2 shrink-0" />
      <button
        type="button"
        onClick={() => onChange('hi')}
        className={`px-3 py-1 text-xs md:text-sm font-bold rounded-full transition-all ${
          currentLang === 'hi'
            ? 'bg-saffron text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
        }`}
      >
        हिंदी
      </button>
      <button
        type="button"
        onClick={() => onChange('en')}
        className={`px-3 py-1 text-xs md:text-sm font-bold rounded-full transition-all ${
          currentLang === 'en'
            ? 'bg-saffron text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
        }`}
      >
        English
      </button>
    </div>
  );
};
