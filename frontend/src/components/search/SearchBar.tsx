import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@hooks/useDebounce';
import { useSearchSuggestions, useTrendingSearches } from '@hooks/useSearch';
import { useRecentSearches } from '@hooks/useRecentSearches';
import { cn } from '@utils/cn';

export const SearchBar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data: suggestions = [], isFetching } = useSearchSuggestions(debouncedQuery);
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

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    addSearch(searchTerm);
    setIsOpen(false);
    inputRef.current?.blur();
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto z-50" ref={wrapperRef}>
      <div 
        className={cn(
          "relative flex items-center bg-white rounded-2xl transition-all duration-300",
          isOpen ? "shadow-2xl ring-2 ring-saffron/50 rounded-b-none" : "shadow-md hover:shadow-lg"
        )}
      >
        <Search className="w-5 h-5 text-saffron absolute left-4" />
        <input 
          ref={inputRef}
          type="text" 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search bhajans, gods, or festivals..." 
          className="w-full h-14 bg-transparent pl-12 pr-12 outline-none text-darkBrown placeholder:text-darkBrown/40"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute right-4 p-1 rounded-full hover:bg-gray-100 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 bg-white border-t border-gray-100 rounded-b-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-2 max-h-[60vh] overflow-y-auto">
              
              {/* Typeahead Suggestions */}
              {query.length >= 2 ? (
                <div>
                  {isFetching ? (
                    <div className="flex items-center justify-center p-4 text-saffron">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((s, i) => (
                      <button 
                        key={i}
                        onClick={() => handleSearch(s)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl text-left transition-colors"
                      >
                        <Search className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-darkBrown">{s}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No matching suggestions found. Press Enter to search anyway.
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between px-3 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <span>Recent</span>
                      </div>
                      {recentSearches.map((r, i) => (
                        <div key={i} className="flex items-center justify-between w-full hover:bg-gray-50 rounded-xl group transition-colors">
                          <button 
                            onClick={() => handleSearch(r)}
                            className="flex-1 flex items-center gap-3 p-3 text-left"
                          >
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-darkBrown">{r}</span>
                          </button>
                          <button 
                            onClick={() => removeSearch(r)}
                            className="p-3 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Trending Searches */}
                  {trending.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between px-3 mb-2 text-xs font-bold text-saffron uppercase tracking-wider">
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Trending Now</span>
                      </div>
                      <div className="flex flex-wrap gap-2 p-2">
                        {trending.map((t, i) => (
                          <button 
                            key={i}
                            onClick={() => handleSearch(t)}
                            className="px-3 py-1.5 bg-saffron/10 text-saffron hover:bg-saffron hover:text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
