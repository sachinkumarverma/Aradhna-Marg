import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService, STORAGE_KEYS, type FavoriteItem } from '@common/storage/StorageService';
import { useUserAuth } from '@/context/UserAuthContext';
import { useTranslation } from '@i18n/LanguageContext';
import { UserAuthApi } from '@api/userAuth';

const FAVORITES_CHANGE_EVENT = 'aradhnamarg_favorites_change';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => StorageService.getFavorites());
  const { isAuthenticated, openAuthModal } = useUserAuth();
  const { language } = useTranslation();
  const isHi = language === 'hi';
  const navigate = useNavigate();

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

    if (!isAuthenticated) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
      const reasonText = isHi
        ? 'भजन को अपनी पसंद सूची में जोड़ने के लिए कृपया लॉग इन करें'
        : 'Please sign in to save this to your wishlist';
      navigate(`/auth?redirect=${encodeURIComponent(currentPath)}&reason=${encodeURIComponent(reasonText)}`);
      return false;
    }

    const updated = StorageService.toggleFavorite(itemOrId);
    setFavorites([...updated]);
    window.dispatchEvent(new Event(FAVORITES_CHANGE_EVENT));
    const targetId = typeof itemOrId === 'object' ? String(itemOrId.id) : String(itemOrId);
    const isNowFav = updated.some((fav) => fav.id === targetId);

    // Sync with backend API
    const itemData = typeof itemOrId === 'object' ? itemOrId : undefined;
    UserAuthApi.toggleWishlist({
      itemId: targetId,
      itemType: itemData?.type || 'bhajan',
      title: itemData?.title || 'Sacred Item',
      hindiTitle: itemData?.englishTitle || null,
      slug: itemData?.url ? itemData.url.split('/').pop() || null : null
    }).catch((err) => {
      console.warn('[useFavorites] Cloud sync failed:', err);
    });

    return isNowFav;
  };

  const removeFavorite = (id: string | number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const updated = StorageService.removeFavorite(id);
    setFavorites([...updated]);
    window.dispatchEvent(new Event(FAVORITES_CHANGE_EVENT));

    if (isAuthenticated) {
      UserAuthApi.toggleWishlist({
        itemId: String(id),
        title: ''
      }).catch(() => {});
    }
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
