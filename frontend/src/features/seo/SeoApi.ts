import { apiClient } from '../../api/client';

export class SeoApi {
  static async getOverview() {
    const response = await apiClient.get('/v1/seo/overview');
    return response.data;
  }

  static async getIssues() {
    const response = await apiClient.get('/v1/seo/issues');
    return response.data;
  }

  static async generateSitemap() {
    const response = await apiClient.post('/v1/seo/sitemap/generate');
    return response.data;
  }

  static async generateRobots() {
    const response = await apiClient.post('/v1/seo/robots/generate');
    return response.data;
  }

  static async generateBulk() {
    const response = await apiClient.post('/v1/seo/generate-bulk', {});
    return response.data;
  }
}
