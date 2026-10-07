export const STORAGE_KEYS = {
  TOKEN: 'admin_token',
  USER: 'admin_user',
  THEME: 'theme',
  FONT_SIZE: 'bhajan_font_size',
  READING_MODE: 'bhajan_reading_mode',
  RECENT_SEARCHES: 'recent_searches',
  LANGUAGE: 'language',
  FAVORITES: 'favorite_items'
} as const;

export interface FavoriteItem {
  id: string;
  type?: 'bhajan' | 'video' | 'article' | 'purana' | 'festival' | 'deity' | 'general';
  title: string;
  englishTitle?: string;
  thumbnailUrl?: string;
  url: string;
  subtitle?: string;
  category?: string;
  addedAt?: number;
}

class StorageServiceImpl {
  // --- Authentication (sessionStorage) ---

  setToken(token: string) {
    sessionStorage.setItem(STORAGE_KEYS.TOKEN, token);
  }

  getToken(): string | null {
    return sessionStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  removeToken() {
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
  }

  setUser(user: any) {
    sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  getUser(): any | null {
    try {
      const data = sessionStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  removeUser() {
    sessionStorage.removeItem(STORAGE_KEYS.USER);
  }

  clearAuth() {
    this.removeToken();
    this.removeUser();
  }

  // --- User Preferences (localStorage) ---

  setTheme(theme: string) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  getTheme(): string | null {
    return localStorage.getItem(STORAGE_KEYS.THEME);
  }

  setFontSize(size: number) {
    localStorage.setItem(STORAGE_KEYS.FONT_SIZE, size.toString());
  }

  getFontSize(): number | null {
    const size = localStorage.getItem(STORAGE_KEYS.FONT_SIZE);
    return size ? parseInt(size, 10) : null;
  }

  setReadingMode(isDark: boolean) {
    localStorage.setItem(STORAGE_KEYS.READING_MODE, isDark ? 'true' : 'false');
  }

  getReadingMode(): boolean {
    return localStorage.getItem(STORAGE_KEYS.READING_MODE) === 'true';
  }

  setRecentSearches(searches: string[]) {
    localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(searches));
  }

  getRecentSearches(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  setLanguage(language: string) {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
  }

  getLanguage(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LANGUAGE);
  }

  // --- Favorites (localStorage) ---
  setFavorites(favorites: FavoriteItem[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites to localStorage:', e);
    }
  }

  getFavorites(): FavoriteItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item: any) => {
          if (typeof item === 'string') return false;
          if (item && item.title === 'Sacred Devotional Item' && !item.thumbnailUrl) return false;
          return true;
        })
        .map((item: any) => {
          const type = item.type || (item.url?.startsWith('/videos') ? 'video' : 'bhajan');
          let url = item.url || (item.slug ? `/${type || 'bhajans'}/${item.slug}` : `/${type || 'bhajans'}/${item.id}`);
          if (type === 'video' && url.startsWith('/bhajans/')) {
            url = url.replace('/bhajans/', '/videos/');
          }
          return {
            id: String(item.id),
            type,
            title: item.title || 'Sacred Item',
            englishTitle: item.englishTitle,
            thumbnailUrl: item.thumbnailUrl,
            url,
            subtitle: item.subtitle,
            category: item.category,
            addedAt: item.addedAt || Date.now()
          };
        });
    } catch {
      return [];
    }
  }

  isFavorite(id: string | number): boolean {
    const stringId = String(id);
    const favorites = this.getFavorites();
    return favorites.some((fav) => fav.id === stringId);
  }

  toggleFavorite(itemOrId: FavoriteItem | string | number): FavoriteItem[] {
    const favorites = this.getFavorites();
    const id = typeof itemOrId === 'object' ? String(itemOrId.id) : String(itemOrId);
    const index = favorites.findIndex((fav) => fav.id === id);
    let updated: FavoriteItem[];

    if (index > -1) {
      updated = favorites.filter((fav) => fav.id !== id);
    } else {
      const newItem: FavoriteItem =
        typeof itemOrId === 'object'
          ? { ...itemOrId, id, addedAt: itemOrId.addedAt || Date.now() }
          : {
              id,
              title: 'Sacred Devotional Item',
              url: `/bhajans/${id}`,
              type: 'bhajan',
              addedAt: Date.now()
            };
      updated = [newItem, ...favorites];
    }
    this.setFavorites(updated);
    return updated;
  }

  removeFavorite(id: string | number): FavoriteItem[] {
    const stringId = String(id);
    const favorites = this.getFavorites();
    const updated = favorites.filter((fav) => fav.id !== stringId);
    this.setFavorites(updated);
    return updated;
  }

  clearFavorites() {
    this.setFavorites([]);
  }

  clearAll() {
    sessionStorage.clear();
    localStorage.clear();
  }
}

export const StorageService = new StorageServiceImpl();
