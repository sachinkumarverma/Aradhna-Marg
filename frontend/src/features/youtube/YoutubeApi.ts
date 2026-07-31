import { apiClient } from '@api/client';

export class YoutubeApi {
  static async getVideos(params?: { search?: string; status?: string; type?: string; sortBy?: string; sortOrder?: string; page?: number; limit?: number }) {
    const response = await apiClient.get('/admin/youtube/videos', { params });
    return response.data;
  }

  static async getHistory() {
    const response = await apiClient.get('/admin/youtube/history');
    return response.data;
  }

  static async getStats() {
    const response = await apiClient.get('/admin/youtube/stats');
    return response.data;
  }

  static async syncNow() {
    const response = await apiClient.post('/admin/youtube/sync');
    return response.data;
  }

  static async linkVideo(videoId: string, bhajanId: string | null) {
    const response = await apiClient.patch(`/admin/youtube/videos/${videoId}/link`, { bhajanId });
    return response.data;
  }

  static async updateStatus(videoId: string, status: string) {
    const response = await apiClient.patch(`/admin/youtube/videos/${videoId}/status`, { status });
    return response.data;
  }

  static async deleteVideo(videoId: string) {
    const response = await apiClient.delete(`/admin/youtube/videos/${videoId}`);
    return response.data;
  }

  static async getBhajansForLink() {
    const response = await apiClient.get('/admin/youtube/bhajans-list');
    return response.data;
  }
}
