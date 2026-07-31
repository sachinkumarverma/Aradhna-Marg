/**
 * Frontend media upload utility.
 * Sends multipart/form-data to the backend media API 
 */
import { apiClient } from './client';

export interface UploadedFile {
  id: string;
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Upload a single file to the backend and return the public URL.
 */
export const uploadFile = async (file: File, folderId?: string): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  if (folderId) formData.append('folderId', folderId);

  const response = await apiClient.post('/admin/media/files', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const data: UploadedFile = response.data.data;
  return data.url;
};
