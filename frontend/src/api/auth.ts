/**
 * Custom JWT-based authentication utility.
 * Replaces Supabase Auth entirely.
 * Token is stored in localStorage under 'admin_token'.
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'admin_token';
const USER_KEY = 'admin_user';

export interface AdminUser {
  username: string;
  role: string;
}

// ── Storage helpers ──────────────────────────────────────────────────────────

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const getUser = (): AdminUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveSession = (token: string, user: AdminUser) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
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
