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

const DEITY_NAME_MAP: Record<string, { hi: string; en: string }> = {
  'lord ganesh': { hi: 'श्री गणेश', en: 'Lord Ganesh' },
  'maa durga': { hi: 'माँ दुर्गा', en: 'Maa Durga' },
  'lord vishnu': { hi: 'भगवान विष्णु', en: 'Lord Vishnu' },
  'lord krishna': { hi: 'श्री कृष्ण', en: 'Lord Krishna' },
  'lord ram': { hi: 'श्री राम', en: 'Lord Ram' },
  'lord shiva': { hi: 'भगवान शिव', en: 'Lord Shiva' },
  'shri radha rani': { hi: 'श्री राधा रानी', en: 'Shri Radha Rani' },
  'lord hanuman': { hi: 'हनुमान जी', en: 'Lord Hanuman' },
  'yamuna maiya': { hi: 'यमुना मैया', en: 'Yamuna Maiya' },
  'surya dev': { hi: 'सूर्य देव', en: 'Surya Dev' },
  'chhathi maiya': { hi: 'छठी मैया', en: 'Chhathi Maiya' },
  'maa saraswati': { hi: 'माँ सरस्वती', en: 'Maa Saraswati' },
  'mata lakshmi': { hi: 'माता लक्ष्मी', en: 'Mata Lakshmi' },
  'mata parvati': { hi: 'माता पार्वती', en: 'Mata Parvati' },
  'khatu shyam': { hi: 'खाटू श्याम जी', en: 'Khatu Shyam Ji' },
  'ganga maiya': { hi: 'गंगा मैया', en: 'Ganga Maiya' },
  'shani dev': { hi: 'शनि देव', en: 'Shani Dev' }
};

function parseBilingualString(val: any, lang: LanguageMode): string {
  if (!val || typeof val !== 'string') return typeof val === 'string' ? val : '';
  const trimmed = val.trim();

  // Format: "English (Hindi)" e.g. "Morning Bhajans (प्रातःकालीन भजन)"
  const enWithHiMatch = trimmed.match(/^([^()]+?)\s*\(([\u0900-\u097F\s.,-]+)\)$/);
  if (enWithHiMatch) {
    return lang === 'en' ? enWithHiMatch[1].trim() : enWithHiMatch[2].trim();
  }

  // Format: "Hindi (English)" e.g. "प्रातःकालीन भजन (Morning Bhajans)"
  const hiWithEnMatch = trimmed.match(/^([\u0900-\u097F\s.,-]+?)\s*\(([A-Za-z0-9\s.,-]+)\)$/);
  if (hiWithEnMatch) {
    return lang === 'en' ? hiWithEnMatch[2].trim() : hiWithEnMatch[1].trim();
  }

  // Check known deity / religious terms dictionary
  const lower = trimmed.toLowerCase();
  if (DEITY_NAME_MAP[lower]) {
    return DEITY_NAME_MAP[lower][lang];
  }

  return trimmed;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'hi' || saved === 'en') return saved;
    } catch {
      // Fallback
    }
    return 'en';
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
    let currentObj: any = locales[language] || locales.en;

    for (const k of keys) {
      if (currentObj && typeof currentObj === 'object' && k in currentObj) {
        currentObj = currentObj[k];
      } else {
        // Fallback to alternate locale
        let fallbackObj: any = locales[language === 'en' ? 'hi' : 'en'];
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
    const capitalized = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

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
        return parseBilingualString(enVal, 'en');
      }

      // Check display field fallback only for matching field types
      let displayVal: any = item[`display${capitalized}`];
      if (!displayVal) {
        if (fieldName === 'title' || fieldName === 'name') {
          displayVal = item.displayTitle || item.displayName;
        } else if (fieldName === 'description' || fieldName === 'short_description' || fieldName === 'excerpt') {
          displayVal = item.displayDescription || item.displayExcerpt;
        } else if (fieldName === 'content') {
          displayVal = item.displayContent;
        }
      }

      if (displayVal && typeof displayVal === 'string' && displayVal.trim() !== '') {
        return parseBilingualString(displayVal, 'en');
      }

      const defaultRaw = item[fieldName] || item[`${fieldName}_en`] || '';
      return parseBilingualString(defaultRaw, 'en');
    }

    let hiVal = item[`${fieldName}_hi`] || item[`hi_${fieldName}`] || item[fieldName];

    if (!hiVal) {
      if (fieldName === 'title' || fieldName === 'name') {
        hiVal = item.displayTitle || item.displayName;
      } else if (fieldName === 'description' || fieldName === 'short_description' || fieldName === 'excerpt') {
        hiVal = item.displayDescription || item.displayExcerpt;
      } else if (fieldName === 'content') {
        hiVal = item.displayContent;
      }
    }

    return parseBilingualString(hiVal || '', 'hi');
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
