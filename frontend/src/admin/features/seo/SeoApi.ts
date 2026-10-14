import { apiClient } from '@api/client';

export class SeoApi {
  static async getOverview() {
    const response = await apiClient.get('/v1/seo/overview');
    return response.data;
  }

  static async getIssues() {
    const response = await apiClient.get('/v1/seo/issues');
    return response.data;
  }

  static async generateBulk() {
    const response = await apiClient.post('/v1/seo/generate-bulk', {});
    return response.data;
  }

  static async runAgentAudit(scope?: string[]) {
    const response = await apiClient.post('/admin/agents/seo-audit/run', { scope });
    return response.data;
  }

  static async getLatestAgentAudit() {
    const response = await apiClient.get('/v1/seo/agent-audit/latest');
    return response.data;
  }
}
