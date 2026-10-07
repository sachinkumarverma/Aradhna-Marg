import React, { useState, useEffect, useCallback } from 'react';
import { StorageService, STORAGE_KEYS, type FavoriteItem } from '@common/storage/StorageService';

const FAVORITES_CHANGE_EVENT = 'aradhnamarg_favorites_change';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => StorageService.getFavorites());

  const syncFavorites = useCallback(() => {
    setFavorites(StorageService.getFavorites());
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || e.key === STORAGE_KEYS.FAVORITES) {
        syncFavorites();
      }
    };
    const handleCustomChange = () => {
      syncFavorites();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(FAVORITES_CHANGE_EVENT, handleCustomChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(FAVORITES_CHANGE_EVENT, handleCustomChange);
    };
  }, [syncFavorites]);

  const toggleFavorite = (itemOrId: FavoriteItem | string | number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const updated = StorageService.toggleFavorite(itemOrId);
    setFavorites([...updated]);
    window.dispatchEvent(new Event(FAVORITES_CHANGE_EVENT));
    const targetId = typeof itemOrId === 'object' ? String(itemOrId.id) : String(itemOrId);
    return updated.some((fav) => fav.id === targetId);
  };

  const removeFavorite = (id: string | number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const updated = StorageService.removeFavorite(id);
    setFavorites([...updated]);
    window.dispatchEvent(new Event(FAVORITES_CHANGE_EVENT));
  };

  const clearAllFavorites = () => {
    StorageService.clearFavorites();
    setFavorites([]);
    window.dispatchEvent(new Event(FAVORITES_CHANGE_EVENT));
  };

  const isFavorite = (id: string | number) => {
    const stringId = String(id);
    return favorites.some((fav) => fav.id === stringId);
  };

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    clearAllFavorites,
    favoritesCount: favorites.length
  };
};

export type { FavoriteItem };
