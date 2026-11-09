import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserAuthApi, type UserProfile } from '@api/userAuth';
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
  login: (email: string, password?: string) => Promise<void>;
  signup: (name: string, email: string, password?: string) => Promise<void>;
  googleAuth: (credential: string, mode: 'login' | 'signup') => Promise<void>;
  setDirectToken: (token: string) => Promise<void>;
  logout: () => void;
  syncLocalFavoritesToCloud: () => Promise<void>;
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
          syncLocalFavoritesToCloud();
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
  }, [syncLocalFavoritesToCloud]);

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

  const fetchCloudFavorites = useCallback(async () => {
    try {
      const res = await UserAuthApi.getWishlist();
      if (res?.data && Array.isArray(res.data)) {
        const existing = StorageService.getFavorites();
        const existingIds = new Set(existing.map((f) => f.id));
        const newItems: FavoriteItem[] = [];

        res.data.forEach((w: any) => {
          if (!existingIds.has(w.item_id)) {
            newItems.push({
              id: w.item_id,
              type: (w.item_type as any) || 'bhajan',
              title: w.title,
              englishTitle: w.title,
              url: w.slug ? `/${w.item_type || 'bhajans'}/${w.slug}` : `/${w.item_type || 'bhajans'}/${w.item_id}`,
              addedAt: Date.now()
            });
            existingIds.add(w.item_id);
          }
        });

        if (newItems.length > 0) {
          StorageService.setFavorites([...newItems, ...existing]);
          window.dispatchEvent(new Event('aradhnamarg_favorites_change'));
        }
      }
    } catch (err) {
      console.warn('[UserAuth] Failed to load cloud wishlists:', err);
    }
  }, []);

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
    try {
      const res = await UserAuthApi.login({ email, password });
      handlePostAuth(res.data.user, res.data.token);
      toast.success('Successfully signed in! 🙏');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Sign in failed.';
      toast.error(msg);
      throw err;
    }
  };

  const signup = async (name: string, email: string, password?: string) => {
    try {
      const res = await UserAuthApi.signup({ name, email, password });
      handlePostAuth(res.data.user, res.data.token);
      toast.success('Welcome to Aradhna Marg! 🙏');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Sign up failed.';
      toast.error(msg);
      throw err;
    }
  };

  const googleAuth = async (credential: string, mode: 'login' | 'signup') => {
    try {
      const res = await UserAuthApi.googleAuth(credential, mode);
      handlePostAuth(res.data.user, res.data.token);
      toast.success(
        mode === 'signup' ? 'Account registered with Google! 🙏' : 'Signed in with Google successfully! 🙏'
      );
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
    toast.success('You have been signed out.');
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
        syncLocalFavoritesToCloud
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
