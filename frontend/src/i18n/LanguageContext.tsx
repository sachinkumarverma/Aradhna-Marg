import React, { createContext, useContext, useState, useEffect } from 'react';
import { hi, type TranslationKeys } from './locales/hi';
import { en } from './locales/en';

export type LanguageMode = 'hi' | 'en';

const locales: Record<LanguageMode, TranslationKeys> = { hi, en };

interface LanguageContextType {
  language: LanguageMode;
  setLanguage: (lang: LanguageMode) => void;
  t: (key: string) => string;
  getLocalizedField: (item: any, fieldName: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'aradhnamarg_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'hi' || saved === 'en') return saved;
    } catch {
      // Fallback
    }
    return 'hi';
  });

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.setAttribute('dir', 'ltr');
  }, [language]);

  const setLanguage = (lang: LanguageMode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (err) {
      console.error('Failed to save language choice:', err);
    }
  };

  const t = (path: string): string => {
    const keys = path.split('.');
    let currentObj: any = locales[language] || locales.hi;

    for (const k of keys) {
      if (currentObj && typeof currentObj === 'object' && k in currentObj) {
        currentObj = currentObj[k];
      } else {
        // Fallback to Hindi locale
        let fallbackObj: any = locales.hi;
        for (const fk of keys) {
          if (fallbackObj && typeof fallbackObj === 'object' && fk in fallbackObj) {
            fallbackObj = fallbackObj[fk];
          } else {
            return path;
          }
        }
        return typeof fallbackObj === 'string' ? fallbackObj : path;
      }
    }

    return typeof currentObj === 'string' ? currentObj : path;
  };

  const getLocalizedField = (item: any, fieldName: string): string => {
    if (!item) return '';
    if (language === 'en') {
      const enVal =
        item[`${fieldName}_en`] ||
        item[`en_${fieldName}`] ||
        item[`${fieldName}En`] ||
        (fieldName === 'short_description'
          ? item['description_en'] ||
            item['short_description_en'] ||
            item['shortDescription_en'] ||
            item['displayDescription']
          : undefined) ||
        (fieldName === 'description'
          ? item['description_en'] ||
            item['short_description_en'] ||
            item['shortDescription_en'] ||
            item['displayDescription']
          : undefined) ||
        (fieldName === 'title' ? item['title_en'] || item['english_title'] || item['displayTitle'] : undefined) ||
        (fieldName === 'name' ? item['name_en'] || item['displayName'] : undefined) ||
        (fieldName === 'content' ? item['content_en'] || item['displayContent'] : undefined) ||
        (fieldName === 'excerpt' ? item['excerpt_en'] || item['displayExcerpt'] : undefined);

      if (enVal && typeof enVal === 'string' && enVal.trim() !== '') {
        return enVal;
      }

      // Check display field fallback
      const capitalized = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
      const displayVal =
        item[`display${capitalized}`] || item.displayDescription || item.displayTitle || item.displayName;
      if (displayVal && typeof displayVal === 'string' && displayVal.trim() !== '') {
        return displayVal;
      }
    }
    return item[fieldName] || item[`${fieldName}_hi`] || item.displayDescription || item.displayTitle || '';
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getLocalizedField }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
