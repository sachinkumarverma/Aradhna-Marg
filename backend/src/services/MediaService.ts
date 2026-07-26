import { mediaRepository } from '../repositories/MediaRepository';
import { supabase } from '../database/supabase';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

export class MediaService {
  private readonly BUCKET_NAME = 'public'; // Assuming 'public' bucket or 'media' bucket. We use 'public' as seen in UI previously.
  private readonly MEDIA_FOLDER = 'media-library';

  // Folders
  async createFolder(name: string, parentId?: string) {
    return mediaRepository.createFolder({ name, parentId });
  }

  async getFolders(parentId?: string) {
    return mediaRepository.getFolders(parentId);
  }

  async renameFolder(id: string, newName: string) {
    return mediaRepository.updateFolder(id, newName);
  }

  async deleteFolder(id: string) {
    // In a real system, we'd recursively delete files from Supabase Storage as well.
    // For this implementation, deleting from the database triggers CASCADE deletes for files in DB.
    // We should ideally fetch all files recursively and delete them from storage.
    return mediaRepository.deleteFolder(id);
  }

  // Files
  async uploadFile(file: Express.Multer.File, folderId?: string) {
    const fileId = uuidv4();
    const ext = file.originalname.split('.').pop() || '';
    const isImage = file.mimetype.startsWith('image/');
    
    let processedBuffer = file.buffer;
    let thumbnailUrl: string | undefined;
    let dimensions: string | undefined;

    if (isImage && !file.mimetype.includes('svg')) {
      const metadata = await sharp(file.buffer).metadata();
      dimensions = `${metadata.width}x${metadata.height}`;

      // Compress original
      processedBuffer = await sharp(file.buffer)
        .resize({ width: 1920, withoutEnlargement: true }) // Max 1080p width
        .webp({ quality: 80 })
        .toBuffer();
      
      file.mimetype = 'image/webp';
      
      // Generate thumbnail
      const thumbBuffer = await sharp(file.buffer)
        .resize({ width: 200, height: 200, fit: 'cover' })
        .webp({ quality: 60 })
        .toBuffer();

      const thumbPath = `${this.MEDIA_FOLDER}/${fileId}_thumb.webp`;
      const { error: thumbError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(thumbPath, thumbBuffer, { contentType: 'image/webp' });

      if (!thumbError) {
        const { data: thumbData } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(thumbPath);
        thumbnailUrl = thumbData.publicUrl;
      }
    }

    const storagePath = `${this.MEDIA_FOLDER}/${fileId}.webp`; // Use original ext if not image
    const actualExt = isImage && !file.mimetype.includes('svg') ? 'webp' : ext;
    const actualStoragePath = `${this.MEDIA_FOLDER}/${fileId}.${actualExt}`;

    const { error: uploadError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(actualStoragePath, processedBuffer, { contentType: file.mimetype });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(actualStoragePath);

    return mediaRepository.createFile({
      fileName: file.originalname,
      originalName: file.originalname,
      folderId,
      mimeType: file.mimetype,
      sizeBytes: processedBuffer.length,
      url: publicUrlData.publicUrl,
      thumbnailUrl,
      dimensions,
      storagePath: actualStoragePath
    });
  }

  async getFiles(folderId?: string, search?: string) {
    return mediaRepository.getFiles(folderId, search);
  }

  async renameFile(id: string, newName: string) {
    return mediaRepository.updateFile(id, { fileName: newName });
  }

  async deleteFile(id: string) {
    const file = await mediaRepository.getFile(id);
    if (!file) throw new Error('File not found');

    const pathsToDelete = [file.storagePath];
    if (file.thumbnailUrl) {
      const thumbPath = file.storagePath.replace(/\.[^/.]+$/, "") + "_thumb.webp";
      pathsToDelete.push(thumbPath);
    }

    await supabase.storage.from(this.BUCKET_NAME).remove(pathsToDelete);
    await mediaRepository.deleteFile(id);
  }

  async bulkDeleteFiles(ids: string[]) {
    for (const id of ids) {
      await this.deleteFile(id);
    }
  }

  async bulkMoveFiles(ids: string[], newFolderId: string | null) {
    for (const id of ids) {
      await mediaRepository.updateFile(id, { folderId: newFolderId });
    }
  }
}

export const mediaService = new MediaService();
