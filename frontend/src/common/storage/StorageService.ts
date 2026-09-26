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
  setFavorites(favorites: string[]) {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }

  getFavorites(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  isFavorite(id: string): boolean {
    const favorites = this.getFavorites();
    return favorites.includes(id);
  }

  toggleFavorite(id: string): string[] {
    const favorites = this.getFavorites();
    const index = favorites.indexOf(id);
    let updated: string[];
    if (index > -1) {
      updated = favorites.filter((favId) => favId !== id);
    } else {
      updated = [...favorites, id];
    }
    this.setFavorites(updated);
    return updated;
  }

  clearAll() {
    sessionStorage.clear();
    localStorage.clear();
  }
}

export const StorageService = new StorageServiceImpl();
