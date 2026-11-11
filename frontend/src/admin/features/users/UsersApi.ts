import { apiClient } from '@api/client';

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  google_id: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  login_failed_attempts: number;
  login_locked_until: string | null;
  is_login_locked: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUserStats {
  total: number;
  active: number;
  inactive: number;
  googleUsers: number;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'locked' | 'all';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetUsersResponse {
  success: boolean;
  message: string;
  data: AdminUserItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const UsersApi = {
  async getUsers(params: GetUsersParams = {}): Promise<GetUsersResponse> {
    const res = await apiClient.get<GetUsersResponse>('/admin/users', { params });
    return res.data;
  },

  async getUserStats(): Promise<{ success: boolean; data: AdminUserStats }> {
    const res = await apiClient.get<{ success: boolean; data: AdminUserStats }>('/admin/users/stats');
    return res.data;
  },

  async toggleStatus(id: string, isActive: boolean): Promise<{ success: boolean; data: AdminUserItem }> {
    const res = await apiClient.patch<{ success: boolean; data: AdminUserItem }>(`/admin/users/${id}/status`, {
      is_active: isActive
    });
    return res.data;
  },

  async unlockUser(id: string): Promise<{ success: boolean; data: Partial<AdminUserItem> }> {
    const res = await apiClient.post<{ success: boolean; data: Partial<AdminUserItem> }>(`/admin/users/${id}/unlock`);
    return res.data;
  }
};
