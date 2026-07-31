import { apiClient } from '../../api/client';

export class TagApi {
  static async getTags(params?: { page?: number; limit?: number; search?: string; status?: string }) {
    const response = await apiClient.get('/admin/tags', { params });
    return response.data;
  }

  static async getTag(id: string) {
    const response = await apiClient.get(`/admin/tags/${id}`);
    return response.data;
  }

  static async createTag(data: any) {
    const response = await apiClient.post('/admin/tags', data);
    return response.data;
  }

  static async updateTag(id: string, data: any) {
    const response = await apiClient.put(`/admin/tags/${id}`, data);
    return response.data;
  }

  static async deleteTag(id: string) {
    const response = await apiClient.delete(`/admin/tags/${id}`);
    return response.data;
  }

  static async bulkAction(ids: string[], action: string) {
    const response = await apiClient.post('/admin/tags/bulk', { ids, action });
    return response.data;
  }
}
