import { apiClient } from '@api/client';

export class CategoryApi {
  static async getCategories(params?: { page?: number; limit?: number; search?: string }) {
    const response = await apiClient.get('/admin/categories', { params });
    return response.data;
  }

  static async getCategory(id: string) {
    const response = await apiClient.get(`/admin/categories/${id}`);
    return response.data;
  }

  static async createCategory(data: any) {
    const response = await apiClient.post('/admin/categories', data);
    return response.data;
  }

  static async updateCategory(id: string, data: any) {
    const response = await apiClient.put(`/admin/categories/${id}`, data);
    return response.data;
  }

  static async deleteCategory(id: string) {
    const response = await apiClient.delete(`/admin/categories/${id}`);
    return response.data;
  }
}
