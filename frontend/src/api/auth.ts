/**
 * Custom JWT-based authentication utility.
 */

import axios from 'axios';
import { StorageService } from '@common/storage/StorageService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface AdminUser {
  username: string;
  role: string;
}

// ── Storage helpers ──────────────────────────────────────────────────────────

export const getToken = (): string | null => StorageService.getToken();

export const getUser = (): AdminUser | null => StorageService.getUser();

const saveSession = (token: string, user: AdminUser) => {
  StorageService.setToken(token);
  StorageService.setUser(user);
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

export const logout = async (): Promise<void> => {
  try {
    const token = getToken();
    if (token) {
      await axios.post(
        `${API_BASE}/admin/auth/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
    await axios.get(`${API_BASE}/admin/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return true;
  } catch {
    clearSession();
    return false;
  }
};
