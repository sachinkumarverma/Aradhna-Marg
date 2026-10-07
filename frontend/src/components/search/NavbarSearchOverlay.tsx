import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Music, Scroll, Play, BookOpen, Sparkles, Info, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@hooks/useDebounce';
import { useSearchSuggestions } from '@hooks/useSearch';
import { useTranslation } from '@i18n/LanguageContext';

interface NavbarSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NavbarSearchOverlay: React.FC<NavbarSearchOverlayProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 200);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: suggestions = [], isFetching } = useSearchSuggestions(debouncedQuery);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  // Handle ESC and click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const getTargetUrl = (item: any) => {
    if (!item) return '#';
    const slugOrId = item.slug || item.id;
    switch (item.type) {
      case 'BHAJAN':
        return `/bhajans/${slugOrId}`;
      case 'VIDEO':
        return `/videos/${slugOrId}`;
      case 'ARTICLE':
        return `/articles/${slugOrId}`;
      case 'FESTIVAL':
        return `/festivals/${slugOrId}`;
      case 'PURANA':
        return `/puranas/${slugOrId}`;
      case 'DEITY':
        return `/gods/${slugOrId}`;
      case 'CATEGORY':
        return `/categories/${slugOrId}`;
      default:
        return `/bhajans/${slugOrId}`;
    }
  };

  const handleSelect = (item: any) => {
    onClose();
    if (typeof item === 'string') {
      navigate(`/search?q=${encodeURIComponent(item)}`);
    } else {
      navigate(getTargetUrl(item));
    }
  };

  const handleSearchEntireDb = () => {
    if (!query.trim()) return;
    onClose();
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelect(suggestions[selectedIndex]);
      } else if (query.trim()) {
        handleSearchEntireDb();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'BHAJAN':
        return <Music className="w-4 h-4 text-slate-500" />;
      case 'PURANA':
        return <Scroll className="w-4 h-4 text-orange-500" />;
      case 'VIDEO':
        return <Play className="w-4 h-4 text-red-500" />;
      case 'ARTICLE':
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'FESTIVAL':
        return <Sparkles className="w-4 h-4 text-rose-500" />;
      default:
        return <Music className="w-4 h-4 text-slate-500" />;
    }
  };

  if (!isOpen) return null;

  const isQueryTyped = query.trim().length > 0;
  const hasNoResults = isQueryTyped && !isFetching && suggestions.length === 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 overflow-y-auto pt-[92px] sm:pt-[100px] pb-16">
        {/* Backdrop overlay below navbar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px] -z-10"
        />

        {/* Search Modal Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: -15, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.99 }}
            transition={{ duration: 0.15 }}
            className="w-full"
          >
            {/* Search Input Bar (Matching Image 1, 2, 3) */}
            <div className="relative bg-white rounded-2xl shadow-2xl border-2 border-orange-500 ring-4 ring-orange-400/20 flex items-center transition-all">
              <Search className="w-5 h-5 text-saffron absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(-1);
                }}
                onKeyDown={onKeyDown}
                placeholder={t('common.searchPlaceholder') || 'Search bhajans, scriptures...'}
                className="w-full h-14 sm:h-16 pl-14 pr-14 pt-1 sm:pt-1.5 bg-transparent outline-none text-darkBrown font-medium text-base sm:text-lg placeholder:text-gray-400 font-hindi-body leading-normal translate-y-[1px]"
              />

              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSelectedIndex(-1);
                    inputRef.current?.focus();
                  }}
                  className="absolute right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-darkBrown flex items-center justify-center transition-colors cursor-pointer"
                  title="Clear"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 w-7 h-7 rounded-full hover:bg-slate-100 text-slate-400 hover:text-darkBrown flex items-center justify-center transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown (Matching Image 3 & Image 2) */}
            <div className="mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              {isFetching ? (
                <div className="py-10 flex items-center justify-center gap-2 text-saffron font-bold text-sm font-hindi-heading">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('common.loading')}...</span>
                </div>
              ) : hasNoResults ? (
                /* No Instant Suggestions Found (Matching Image 2) */
                <div className="py-12 px-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-4 font-bold text-xl border border-orange-200/60 shadow-xs">
                    <Info className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-darkBrown mb-1.5 font-hindi-heading">
                    No instant suggestions found
                  </h3>
                  <p className="text-slate-500 text-xs sm:text-sm mb-6 max-w-md mx-auto font-hindi-body leading-relaxed">
                    We couldn't find a quick match for "<span className="font-semibold text-darkBrown">{query}</span>"
                    in our suggestions.
                  </p>
                  <button
                    type="button"
                    onClick={handleSearchEntireDb}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all font-hindi-heading cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search Entire Database</span>
                  </button>
                </div>
              ) : suggestions.length > 0 ? (
                /* Suggestions List (Matching Image 3) */
                <div>
                  <div className="px-5 pt-3.5 pb-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-50 font-hindi-heading">
                    <span>🔥</span>
                    <span>{isQueryTyped ? 'उपलब्ध सुझाव / SUGGESTIONS' : 'TRENDING BHAJANS & SCRIPTURES'}</span>
                  </div>

                  <div className="divide-y divide-gray-50 max-h-[55vh] overflow-y-auto">
                    {suggestions.map((item: any, i: number) => {
                      const isSelected = i === selectedIndex;
                      const hasEnglishSubtitle = item.title_en && item.title_en !== item.title;

                      return (
                        <button
                          key={item.id || i}
                          type="button"
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(i)}
                          className={`w-full flex items-center justify-between px-5 py-3 text-left transition-all duration-150 cursor-pointer group ${
                            isSelected ? 'bg-amber-50/90 text-darkBrown' : 'hover:bg-amber-50/50 text-darkBrown'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            {/* Circular Icon (Matching Image 3) */}
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:shadow-xs transition-all">
                              {getItemIcon(item.type)}
                            </div>

                            {/* Title & Subtitle */}
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-sm truncate font-hindi-heading text-darkBrown group-hover:text-saffron transition-colors leading-snug">
                                {item.title}
                              </div>
                              {hasEnglishSubtitle && (
                                <div className="text-xs text-slate-400 truncate font-sans mt-0.5">{item.title_en}</div>
                              )}
                            </div>
                          </div>

                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-saffron group-hover:translate-x-1 transition-all shrink-0 ml-3" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
