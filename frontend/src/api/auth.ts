/**
 * Custom JWT-based authentication utility.
 */

import axios from 'axios';
import { StorageService } from '@common/storage/StorageService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface AdminUser {
  username: string;
  role: string;
  name?: string;
  email?: string;
  avatar_url?: string | null;
}

// ── Storage helpers ──────────────────────────────────────────────────────────

export const getToken = (): string | null => StorageService.getToken();

export const getUser = (): AdminUser | null => StorageService.getUser();

const saveSession = (token: string, user: AdminUser) => {
  StorageService.setToken(token);
  StorageService.setUser(user);
};

export const setSessionToken = (token: string, user?: AdminUser) => {
  StorageService.setToken(token);
  if (user) {
    StorageService.setUser(user);
  } else {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      StorageService.setUser({
        username: payload.username || payload.name || payload.email || 'Admin User',
        name: payload.name || payload.username || 'Admin User',
        email: payload.email || 'admin@aradhnamarg.com',
        avatar_url: payload.avatar_url || null,
        role: payload.role || 'admin'
      });
    } catch {
      StorageService.setUser({
        username: 'Admin User',
        name: 'Admin User',
        email: 'admin@aradhnamarg.com',
        role: 'admin'
      });
    }
  }
};

export const clearSession = () => {
  StorageService.clearAuth();
};

export const isAuthenticated = (): boolean => !!getToken();

// ── API calls ────────────────────────────────────────────────────────────────

export const login = async (username: string, password: string): Promise<{ token: string; user: AdminUser }> => {
  const response = await axios.post(`${API_BASE}/admin/auth/login`, { username, password });
  const { token, user } = response.data.data;
  saveSession(token, user);
  return { token, user };
};

export const adminGoogleLogin = async (credential: string): Promise<{ token: string; user: AdminUser }> => {
  const response = await axios.post(`${API_BASE}/admin/auth/google`, { credential });
  const { token, user } = response.data.data;
  saveSession(token, user);
  return { token, user };
};

export const logout = async (): Promise<void> => {
  try {
    const token = getToken();
    if (token) {
      await axios.post(`${API_BASE}/admin/auth/logout`, {}, { headers: { Authorization: `Bearer ${token}` } });
    }
  } catch {
    // Ignore errors — we always clear the local session
  } finally {
    clearSession();
  }
};

export const verifySession = async (): Promise<boolean> => {
  const token = getToken();
  if (!token) return false;

  try {
    const res = await axios.get(`${API_BASE}/admin/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data?.data?.user) {
      StorageService.setUser(res.data.data.user);
    }
    return true;
  } catch {
    clearSession();
    return false;
  }
};

export const refreshSession = async (): Promise<string | null> => {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await axios.post(
      `${API_BASE}/admin/auth/refresh`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    const newToken = res.data?.data?.token;
    if (newToken) {
      setSessionToken(newToken, res.data?.data?.user);
      return newToken;
    }
    return null;
  } catch {
    return null;
  }
};
