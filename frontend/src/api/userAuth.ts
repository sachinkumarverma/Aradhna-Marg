import axios from 'axios';
import { getRecaptchaToken } from '@utils/recaptcha';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const USER_TOKEN_KEY = 'aradhnamarg_user_token';
const USER_DATA_KEY = 'aradhnamarg_user_data';
export const USER_SESSION_EXPIRED_EVENT = 'user-session-expired';

const protectedUserEndpoints = ['/me', '/wishlist', '/wishlist/toggle', '/wishlist/sync'];

const postWithCaptchaRetry = async <T>(
  endpoint: string,
  data: Record<string, unknown>,
  fallbackAction: string
): Promise<T> => {
  try {
    const response = await userApi.post<T>(endpoint, data);
    return response.data;
  } catch (error: any) {
    const challenge = error.response?.data;
    if (challenge?.status !== 'CAPTCHA_REQUIRED' || !challenge.captchaRequired) throw error;

    let captchaToken: string;
    try {
      captchaToken = await getRecaptchaToken(challenge.captchaAction || fallbackAction);
    } catch (captchaError: any) {
      captchaError.captchaAttempted = true;
      captchaError.captchaCompleted = false;
      throw captchaError;
    }

    try {
      const retry = await userApi.post<T>(endpoint, { ...data, captchaToken });
      return retry.data;
    } catch (captchaError: any) {
      captchaError.captchaAttempted = true;
      captchaError.captchaCompleted = true;
      throw captchaError;
    }
  }
};

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  google_id?: string | null;
  is_verified?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    token: string;
    user: UserProfile;
  };
}

export interface WishlistItemDTO {
  id: string;
  user_id: string;
  item_id: string;
  item_type: string;
  title: string;
  hindi_title?: string | null;
  slug?: string | null;
  created_at: string;
}

const userApi = axios.create({
  baseURL: `${API_BASE}/v1/auth`,
  headers: {
    'Content-Type': 'application/json'
  }
});

userApi.interceptors.request.use((req) => {
  const token = localStorage.getItem(USER_TOKEN_KEY);
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  req.headers['Accept-Language'] = 'en';
  return req;
});

userApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const endpoint = error.config?.url || '';
    const isProtectedRequest = protectedUserEndpoints.some((path) => endpoint.endsWith(path));

    if (error.response?.status === 401 && isProtectedRequest && localStorage.getItem(USER_TOKEN_KEY)) {
      window.dispatchEvent(
        new CustomEvent(USER_SESSION_EXPIRED_EVENT, {
          detail: {
            message: error.response.data?.message || 'Your session is no longer active. Please sign in again.'
          }
        })
      );
    }

    return Promise.reject(error);
  }
);

export const UserAuthApi = {
  getUserToken(): string | null {
    return localStorage.getItem(USER_TOKEN_KEY);
  },

  getStoredUser(): UserProfile | null {
    const raw = localStorage.getItem(USER_DATA_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setSession(token: string, user: UserProfile) {
    localStorage.setItem(USER_TOKEN_KEY, token);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  },

  async signup(data: { name: string; email: string; password?: string }): Promise<AuthResponse> {
    const res = await userApi.post<AuthResponse>('/signup', data);
    if (res.data.data?.token) {
      this.setSession(res.data.data.token, res.data.data.user);
    }
    return res.data;
  },

  async login(data: { email: string; password?: string; captchaToken?: string }): Promise<AuthResponse> {
    const response = data.captchaToken
      ? await userApi.post<AuthResponse>('/login', data).then((result) => result.data)
      : await postWithCaptchaRetry<AuthResponse>('/login', data, 'user_login');
    if (response.data?.token) {
      this.setSession(response.data.token, response.data.user);
    }
    return response;
  },

  async googleAuth(credential: string, mode: 'login' | 'signup'): Promise<AuthResponse> {
    const res = await userApi.post<AuthResponse>('/google', { credential, mode });
    if (res.data.data?.token) {
      this.setSession(res.data.data.token, res.data.data.user);
    }
    return res.data;
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const res = await userApi.post('/forgot-password', { email });
    return res.data;
  },

  async resetPassword(token: string, password?: string): Promise<{ success: boolean; message: string }> {
    const res = await userApi.post('/reset-password', { token, password });
    return res.data;
  },

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const res = await userApi.post('/verify-email', { token });
    return res.data;
  },

  async resendVerification(email: string): Promise<{ success: boolean; message: string }> {
    const res = await userApi.post('/resend-verification', { email });
    return res.data;
  },

  async getMe(): Promise<{ success: boolean; data: UserProfile }> {
    const res = await userApi.get('/me');
    return res.data;
  },

  async getWishlist(): Promise<{ success: boolean; data: WishlistItemDTO[] }> {
    const res = await userApi.get('/wishlist');
    return res.data;
  },

  async getWishlists(): Promise<{ success: boolean; data: WishlistItemDTO[] }> {
    return this.getWishlist();
  },

  async toggleWishlist(item: {
    itemId: string | number;
    itemType?: string;
    title?: string;
    hindiTitle?: string | null;
    slug?: string | null;
  }): Promise<{ success: boolean; action: 'added' | 'removed'; message: string }> {
    const res = await userApi.post('/wishlist/toggle', item);
    return res.data;
  },

  async syncWishlist(
    items: Array<{
      item_id: string;
      item_type?: string;
      title: string;
      hindi_title?: string | null;
      slug?: string | null;
    }>
  ): Promise<{ success: boolean; data: WishlistItemDTO[] }> {
    const res = await userApi.post('/wishlist/sync', { items });
    return res.data;
  }
};
