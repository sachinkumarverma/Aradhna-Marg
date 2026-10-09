import { apiClient } from '@api/client';

export interface GenerateTranslationParams {
  contentType: 'ARTICLE' | 'PURAN' | 'FESTIVAL';
  contentId: string;
  sourceLang: string;
  targetLang: string;
}

export class TranslationApi {
  static async generate(params: GenerateTranslationParams) {
    const response = await apiClient.post('/admin/translations/generate', params);
    return response.data;
  }

  static async generateLive(payload: { content: Record<string, any>; sourceLang: string; targetLang: string }) {
    const response = await apiClient.post('/admin/translations/generate-live', payload);
    return response.data.data;
  }

  static async getTranslation(contentType: string, contentId: string, targetLanguage: string) {
    const response = await apiClient.get(`/admin/translations/${contentType}/${contentId}/${targetLanguage}`);
    return response.data;
  }

  static async upsertTranslation(payload: any) {
    const response = await apiClient.post('/admin/translations/upsert', payload);
    return response.data;
  }

  static async updateTranslation(id: string, updates: any) {
    const response = await apiClient.put(`/admin/translations/${id}`, updates);
    return response.data;
  }

  static async getDashboardStats() {
    // We will implement this route on the backend shortly
    const response = await apiClient.get('/admin/translations/stats');
    return response.data;
  }

  static async getTranslationsList(params?: any) {
    // We will implement this route on the backend shortly
    const response = await apiClient.get('/admin/translations', { params });
    return response.data;
  }
}
