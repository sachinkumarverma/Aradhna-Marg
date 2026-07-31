import { useState, useEffect } from 'react';
import { StorageService } from '@common/storage/StorageService';

const MAX_RECENT = 10;

export const useRecentSearches = () => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const saved = StorageService.getRecentSearches();
    if (saved && saved.length > 0) {
      setRecentSearches(saved);
    }
  }, []);

  const addSearch = (term: string) => {
    const cleanTerm = term.trim();
    if (!cleanTerm) return;

    setRecentSearches(prev => {
      // Remove if it exists to push to front
      const filtered = prev.filter(t => t.toLowerCase() !== cleanTerm.toLowerCase());
      const updated = [cleanTerm, ...filtered].slice(0, MAX_RECENT);
      StorageService.setRecentSearches(updated);
      return updated;
    });
  };

  const clearRecent = () => {
    setRecentSearches([]);
    StorageService.setRecentSearches([]);
  };

  const removeSearch = (term: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(t => t !== term);
      StorageService.setRecentSearches(updated);
      return updated;
    });
  };

  return { recentSearches, addSearch, clearRecent, removeSearch };
};
