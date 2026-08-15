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
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  const data: UploadedFile = response.data.data;
  return data.url;
};

/**
 * Upload a single file to the backend and return the full UploadedFile object.
 */
export const uploadMediaFile = async (file: File, folderId?: string): Promise<UploadedFile> => {
  const formData = new FormData();
  formData.append('file', file);
  if (folderId) formData.append('folderId', folderId);

  const response = await apiClient.post('/admin/media/files', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return response.data.data;
};

/**
 * Upload a Puran PDF to the backend and return the storage key.
 */
export const uploadPuranPdf = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/admin/puranas/upload-pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return response.data.data.storageKey;
};
