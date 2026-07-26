export interface MediaFolder {
  id: string;
  name: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaFile {
  id: string;
  fileName: string;
  originalName: string;
  folderId?: string | null;
  mimeType: string;
  sizeBytes: number;
  url: string;
  thumbnailUrl?: string;
  dimensions?: string;
  storagePath: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMediaFolderDTO {
  name: string;
  parentId?: string | null;
}

export interface CreateMediaFileDTO {
  fileName: string;
  originalName: string;
  folderId?: string | null;
  mimeType: string;
  sizeBytes: number;
  url: string;
  thumbnailUrl?: string;
  dimensions?: string;
  storagePath: string;
}

export interface UpdateMediaFileDTO {
  fileName?: string;
  folderId?: string | null;
}
