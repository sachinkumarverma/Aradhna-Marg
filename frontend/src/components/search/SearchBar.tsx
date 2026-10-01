import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, TrendingUp, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@hooks/useDebounce';
import { useSearchSuggestions, useTrendingSearches } from '@hooks/useSearch';
import { useRecentSearches } from '@hooks/useRecentSearches';
import { cn } from '@utils/cn';
import { useTranslation } from '../../i18n/LanguageContext';

interface SearchBarProps {
  scope?: string;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ scope = 'ALL', placeholder, autoFocus = false, className }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 250);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data: suggestions = [], isFetching } = useSearchSuggestions(debouncedQuery, scope);
  const { data: trending = [] } = useTrendingSearches();
  const { recentSearches, addSearch, removeSearch } = useRecentSearches();

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTargetUrl = (item: any) => {
    if (!item) return `/search?q=${encodeURIComponent(query)}`;
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
        return `/search?q=${encodeURIComponent(item.title || query)}`;
    }
  };

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    addSearch(searchTerm.trim());
    setIsOpen(false);
    inputRef.current?.blur();
    const typeQuery = scope && scope !== 'ALL' ? `&type=${scope}` : '';
    navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}${typeQuery}`);
  };

  const handleSelectSuggestion = (item: any) => {
    if (typeof item === 'string') {
      handleSearch(item);
    } else {
      addSearch(item.title);
      setIsOpen(false);
      inputRef.current?.blur();
      navigate(getTargetUrl(item));
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else {
        handleSearch(query);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={cn('relative w-full max-w-3xl mx-auto z-40', className)} ref={wrapperRef}>
      <div
        className={cn(
          'relative flex items-center bg-white rounded-2xl border transition-all duration-200',
          isOpen
            ? 'shadow-2xl border-saffron ring-2 ring-saffron/30 rounded-b-none'
            : 'border-gray-200/80 shadow-sm hover:border-saffron/40 hover:shadow-md'
        )}
      >
        <Search className="w-5 h-5 text-saffron absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder || t('common.searchPlaceholder')}
          className="w-full h-13 md:h-14 bg-transparent pl-12 pr-12 outline-none text-darkBrown placeholder:text-gray-400 font-medium font-hindi-body text-base"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelectedIndex(-1);
            }}
            className="absolute right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-darkBrown transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Live Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 bg-white border-x border-b border-gray-200 rounded-b-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-2 max-h-[65vh] overflow-y-auto">
              {/* Typeahead Suggestions */}
              {query.trim().length >= 2 ? (
                <div>
                  {isFetching ? (
                    <div className="flex items-center justify-center py-6 text-saffron gap-2 font-medium text-sm font-hindi-heading">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('common.loading')}...</span>
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div>
                      <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        उपलब्ध परिणाम / Suggestions
                      </div>
                      <div className="flex flex-col gap-1">
                        {suggestions.map((item: any, i: number) => {
                          const isObj = typeof item === 'object' && item !== null;
                          const title = isObj ? item.title : item;
                          const titleEn = isObj ? item.title_en : null;
                          const typeLabel = isObj ? item.type_label || item.type : '';
                          const isSelected = i === selectedIndex;

                          return (
                            <button
                              key={isObj ? item.id || i : i}
                              type="button"
                              onClick={() => handleSelectSuggestion(item)}
                              className={cn(
                                'w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer group',
                                isSelected
                                  ? 'bg-amber-100/70 text-saffron ring-1 ring-saffron/30'
                                  : 'hover:bg-amber-50/70 text-darkBrown'
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                {isObj && item.image ? (
                                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-black/5 shadow-xs">
                                    <img src={item.image} alt={title} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-saffron shrink-0 font-bold text-sm">
                                    {typeLabel?.includes('पुराण')
                                      ? '📜'
                                      : typeLabel?.includes('भजन')
                                        ? '🪔'
                                        : typeLabel?.includes('वीडियो')
                                          ? '▶'
                                          : '📖'}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-sm truncate font-hindi-heading text-darkBrown group-hover:text-saffron transition-colors">
                                    {title}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {typeLabel && (
                                      <span className="text-[10px] font-bold text-saffron bg-saffron/10 px-1.5 py-0.5 rounded-md">
                                        {typeLabel}
                                      </span>
                                    )}
                                    {titleEn && titleEn !== title && (
                                      <span className="text-[11px] text-slate-400 font-medium truncate">{titleEn}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-saffron group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                            </button>
                          );
                        })}
                      </div>

                      {/* Full Results Link */}
                      <button
                        type="button"
                        onClick={() => handleSearch(query)}
                        className="w-full mt-2 p-2.5 bg-saffron/10 hover:bg-saffron/20 text-saffron font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors font-hindi-heading cursor-pointer"
                      >
                        <span>"{query}" के सभी परिणाम देखें</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-gray-500 text-sm font-hindi-body">
                      "{query}" के लिए कोई परिणाम नहीं मिला। Enter दबाकर संपूर्ण खोज करें।
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-1">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between px-3 mb-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        <span>{t('common.recentSearches')}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {recentSearches.map((r, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between w-full hover:bg-gray-50 rounded-xl group transition-colors"
                          >
                            <button
                              type="button"
                              onClick={() => handleSearch(r)}
                              className="flex-1 flex items-center gap-3 p-2.5 text-left text-sm font-medium text-darkBrown font-hindi-body cursor-pointer"
                            >
                              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                              <span className="truncate">{r}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSearch(r);
                              }}
                              className="p-2 mr-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-500 transition-all cursor-pointer rounded-lg hover:bg-rose-50"
                              title="हटाएं"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Searches */}
                  {trending.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between px-3 mb-2 text-[11px] font-bold text-saffron uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> {t('common.trendingNow')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 px-2 pb-2">
                        {trending.map((trendItem: string, i: number) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSearch(trendItem)}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-saffron hover:text-white text-darkBrown rounded-full text-xs font-semibold transition-colors border border-amber-200/60 font-hindi-heading cursor-pointer"
                          >
                            {trendItem}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
