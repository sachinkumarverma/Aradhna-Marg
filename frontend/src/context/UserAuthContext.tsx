import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserAuthApi, USER_SESSION_EXPIRED_EVENT, type UserProfile } from '@api/userAuth';
import { StorageService, type FavoriteItem } from '@common/storage/StorageService';
import { useTranslation } from '@i18n/LanguageContext';
import toast from 'react-hot-toast';

export type AuthModalMode = 'login' | 'signup' | 'forgot';

interface UserAuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  authModalOpen: boolean;
  authModalMode: AuthModalMode;
  authModalReason: string;
  openAuthModal: (reason?: string, mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: AuthModalMode) => void;
  login: (email: string, password?: string) => Promise<any>;
  signup: (name: string, email: string, password?: string) => Promise<any>;
  googleAuth: (credential: string, mode: 'login' | 'signup') => Promise<any>;
  setDirectToken: (token: string) => Promise<void>;
  logout: () => void;
  syncLocalFavoritesToCloud: () => Promise<void>;
  fetchCloudFavorites: () => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export const UserAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useTranslation();
  const isHi = language === 'hi';

  const [user, setUser] = useState<UserProfile | null>(() => UserAuthApi.getStoredUser());
  const [token, setToken] = useState<string | null>(() => UserAuthApi.getUserToken());
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');
  const [authModalReason, setAuthModalReason] = useState<string>('');

  const handleForcedLogout = useCallback((message?: string) => {
    const hadSession = Boolean(UserAuthApi.getUserToken());
    UserAuthApi.clearSession();
    setUser(null);
    setToken(null);

    if (!hadSession) return;

    const reason = message || 'Your session is no longer active. Please sign in again.';
    toast.error(reason, { id: 'user-session-expired', duration: 5000 });

    if (typeof window !== 'undefined' && window.location.pathname !== '/auth') {
      const currentPath = window.location.pathname + window.location.search;
      const params = new URLSearchParams({
        redirect: currentPath,
        reason
      });
      window.location.assign(`/auth?${params.toString()}`);
    }
  }, []);

  // A deactivated account is revoked globally when any protected request returns 401.
  useEffect(() => {
    const onUserSessionExpired = (event: Event) => {
      const message = (event as CustomEvent<{ message?: string }>).detail?.message;
      handleForcedLogout(message);
    };

    window.addEventListener(USER_SESSION_EXPIRED_EVENT, onUserSessionExpired);
    return () => window.removeEventListener(USER_SESSION_EXPIRED_EVENT, onUserSessionExpired);
  }, [handleForcedLogout]);

  const syncLocalFavoritesToCloud = useCallback(async () => {
    try {
      const localFavs = StorageService.getFavorites();
      if (localFavs.length > 0) {
        const payload = localFavs.map((f) => ({
          item_id: String(f.id),
          item_type: f.type || 'bhajan',
          title: f.title,
          hindi_title: f.title,
          slug: f.url ? f.url.split('/').pop() || null : null
        }));
        await UserAuthApi.syncWishlist(payload);
      }
    } catch (err) {
      console.warn('[UserAuth] Failed to sync local favorites to cloud:', err);
    }
  }, []);

  const fetchCloudFavorites = useCallback(async () => {
    try {
      const res = await UserAuthApi.getWishlist();
      if (res?.data && Array.isArray(res.data)) {
        const existing = StorageService.getFavorites();
        const items = [...existing];
        let hasChanges = false;

        res.data.forEach((w: any) => {
          const thumb =
            w.thumbnail_url ||
            (w.item_type === 'video' && w.slug && w.slug.length === 11
              ? `https://i.ytimg.com/vi/${w.slug}/hqdefault.jpg`
              : undefined);

          // Find existing item by id, slug, url, or title
          const existingIdx = items.findIndex(
            (f) =>
              f.id === String(w.item_id) ||
              (w.slug && f.id === String(w.slug)) ||
              (w.slug && f.url && (f.url.endsWith(`/${w.slug}`) || f.url === w.slug)) ||
              (w.title && f.title && f.title.trim().toLowerCase() === w.title.trim().toLowerCase())
          );

          if (existingIdx !== -1) {
            const current = items[existingIdx];
            if (thumb && current.thumbnailUrl !== thumb) {
              current.thumbnailUrl = thumb;
              hasChanges = true;
            }
            if (current.id !== String(w.item_id)) {
              current.id = String(w.item_id);
              hasChanges = true;
            }
          } else {
            items.unshift({
              id: String(w.item_id),
              type: (w.item_type as any) || 'bhajan',
              title: w.title,
              englishTitle: w.hindi_title || w.title,
              thumbnailUrl: thumb,
              url: w.slug
                ? `/${w.item_type === 'article' ? 'articles' : w.item_type === 'purana' ? 'puranas' : w.item_type === 'video' ? 'videos' : 'bhajans'}/${w.slug}`
                : `/${w.item_type || 'bhajans'}/${w.item_id}`,
              addedAt: Date.now()
            });
            hasChanges = true;
          }
        });

        if (hasChanges) {
          StorageService.setFavorites(items);
          window.dispatchEvent(new Event('aradhnamarg_favorites_change'));
        }
      }
    } catch (err) {
      console.warn('[UserAuth] Failed to load cloud wishlists:', err);
    }
  }, []);

  // Verify session on mount
  useEffect(() => {
    async function initSession() {
      const existingToken = UserAuthApi.getUserToken();
      if (!existingToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await UserAuthApi.getMe();
        if (res?.data) {
          setUser(res.data);
          await syncLocalFavoritesToCloud();
          await fetchCloudFavorites();
        } else {
          UserAuthApi.clearSession();
          setUser(null);
          setToken(null);
        }
      } catch {
        UserAuthApi.clearSession();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, [syncLocalFavoritesToCloud, fetchCloudFavorites]);

  const openAuthModal = (reason?: string, mode: AuthModalMode = 'login') => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search;
      const params = new URLSearchParams();
      if (mode && mode !== 'login') params.set('mode', mode);
      if (currentPath && currentPath !== '/auth' && currentPath !== '/login') params.set('redirect', currentPath);
      if (reason) params.set('reason', reason);
      const target = `/auth?${params.toString()}`;
      window.location.assign(target);
    }
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setAuthModalReason('');
  };

  const handlePostAuth = async (resUser: UserProfile, resToken: string) => {
    setUser(resUser);
    setToken(resToken);
    closeAuthModal();
    await syncLocalFavoritesToCloud();
    await fetchCloudFavorites();
  };

  const setDirectToken = async (newToken: string) => {
    let initialUser: UserProfile = { id: '', name: '', email: '', is_verified: true };
    try {
      const payload = JSON.parse(atob(newToken.split('.')[1]));
      initialUser = {
        id: payload.id || '',
        name: payload.name || 'Devotee',
        email: payload.email || '',
        is_verified: true
      };
    } catch {
      // ignore
    }

    UserAuthApi.setSession(newToken, initialUser);
    setUser(initialUser);
    setToken(newToken);
    closeAuthModal();

    try {
      const res = await UserAuthApi.getMe();
      if (res?.data) {
        UserAuthApi.setSession(newToken, res.data);
        setUser(res.data);
        await syncLocalFavoritesToCloud();
        await fetchCloudFavorites();
      }
    } catch (err) {
      console.warn('[UserAuth] getMe failed in setDirectToken:', err);
    }
  };

  const login = async (email: string, password?: string) => {
    const res = await UserAuthApi.login({ email, password });
    handlePostAuth(res.data.user, res.data.token);
  };

  const signup = async (name: string, email: string, password?: string) => {
    try {
      const res = await UserAuthApi.signup({ name, email, password });
      if (res.data?.token) {
        handlePostAuth(res.data.user, res.data.token);
      }
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Sign up failed.';
      toast.error(msg);
      throw err;
    }
  };

  const googleAuth = async (credential: string, mode: 'login' | 'signup') => {
    try {
      const res = await UserAuthApi.googleAuth(credential, mode);
      if (res.data?.token) {
        handlePostAuth(res.data.user, res.data.token);
      }
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Google authentication failed.';
      toast.error(msg);
      throw err;
    }
  };

  const logout = () => {
    UserAuthApi.clearSession();
    setUser(null);
    setToken(null);
  };

  return (
    <UserAuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        authModalOpen,
        authModalMode,
        authModalReason,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
        login,
        signup,
        googleAuth,
        setDirectToken,
        logout,
        syncLocalFavoritesToCloud,
        fetchCloudFavorites
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
};
