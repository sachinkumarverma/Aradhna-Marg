import React, { useState, useEffect } from 'react';
import { StorageService, STORAGE_KEYS } from '@common/storage/StorageService';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>(() => StorageService.getFavorites());

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || e.key === STORAGE_KEYS.FAVORITES) {
        setFavorites(StorageService.getFavorites());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleFavorite = (id: string | number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const stringId = String(id);
    const updated = StorageService.toggleFavorite(stringId);
    setFavorites([...updated]);
    return updated.includes(stringId);
  };

  const isFavorite = (id: string | number) => {
    return favorites.includes(String(id));
  };

  return { favorites, isFavorite, toggleFavorite };
};
