import { apiClient } from '@api/client';

export class BhajanApi {
  static async getList(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
    primaryDeity?: string;
    sort?: string;
  }) {
    const response = await apiClient.get('/admin/bhajans', { params });
    return response.data;
  }

  static async getById(id: string) {
    const response = await apiClient.get(`/admin/bhajans/${id}`);
    return response.data;
  }

  static async create(data: any) {
    const response = await apiClient.post('/admin/bhajans', data);
    return response.data;
  }

  static async update(id: string, data: any) {
    const response = await apiClient.put(`/admin/bhajans/${id}`, data);
    return response.data;
  }

  static async delete(id: string) {
    const response = await apiClient.delete(`/admin/bhajans/${id}`);
    return response.data;
  }

  static async bulkAction(ids: string[], action: 'PUBLISH' | 'DRAFT' | 'ARCHIVE' | 'DELETE') {
    const response = await apiClient.post('/admin/bhajans/bulk', { ids, action });
    return response.data;
  }
}
