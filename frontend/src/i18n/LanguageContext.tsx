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
      const enVal = item[`${fieldName}_en`] || item[`en_${fieldName}`] || item[`${fieldName}En`];
      if (enVal && typeof enVal === 'string' && enVal.trim() !== '') {
        return enVal;
      }
    }
    return item[fieldName] || item[`${fieldName}_hi`] || '';
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
