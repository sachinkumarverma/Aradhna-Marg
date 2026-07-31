import { apiClient } from '../../api/client';

export class DeityApi {
  static async getDeities(params?: { page?: number; limit?: number; search?: string }) {
    const response = await apiClient.get('/admin/deities', { params });
    return response.data;
  }

  static async getDeity(id: string) {
    const response = await apiClient.get(`/admin/deities/${id}`);
    return response.data;
  }

  static async createDeity(data: any) {
    const response = await apiClient.post('/admin/deities', data);
    return response.data;
  }

  static async updateDeity(id: string, data: any) {
    const response = await apiClient.put(`/admin/deities/${id}`, data);
    return response.data;
  }

  static async deleteDeity(id: string) {
    const response = await apiClient.delete(`/admin/deities/${id}`);
    return response.data;
  }

  static async bulkAction(ids: string[], action: string) {
    const response = await apiClient.post('/admin/deities/bulk', { ids, action });
    return response.data;
  }
}
