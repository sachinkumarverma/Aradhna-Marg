import { mediaRepository } from '@repositories/MediaRepository';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Handles uploading files to Supabase Storage and storing metadata in DB.
 */
import { supabase } from '@/utils/supabaseStorage';
export class MediaService {
  // Supabase bucket configuration
  private readonly bucketName: string;

  constructor() {
    this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'aradhna-images';
  }

  // ── Folders ─────────────────────────────────────────────────────────────────

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
    // For simplicity we soft-delete from DB; physical cleanup can be a scheduled job
    return mediaRepository.deleteFolder(id);
  }

  // ── Files ────────────────────────────────────────────────────────────────────

  async uploadFile(file: Express.Multer.File, folderId?: string) {
    const fileId = uuidv4();
    const ext = file.originalname.split('.').pop() || 'bin';
    const isImage = file.mimetype.startsWith('image/') && !file.mimetype.includes('svg');

    let processedBuffer = file.buffer;
    let thumbnailUrl: string | undefined;
    let dimensions: string | undefined;
    let finalExt = ext;
    let finalMimeType = file.mimetype;

    if (isImage) {
      const metadata = await sharp(file.buffer).metadata();
      dimensions = `${metadata.width}x${metadata.height}`;

      // Compress original to WebP
      processedBuffer = await sharp(file.buffer)
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      finalExt = 'webp';
      finalMimeType = 'image/webp';
    }

    const filename = `${fileId}.${finalExt}`;
    const filePath = `uploads/${filename}`;
    
    // Upload main file to Supabase
    const { error: uploadError } = await supabase.storage
      .from(this.bucketName)
      .upload(filePath, processedBuffer, {
        contentType: finalMimeType,
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw new Error('Failed to upload file to storage bucket');
    }

    const { data: { publicUrl } } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    if (isImage) {
      // Generate thumbnail
      const thumbBuffer = await sharp(file.buffer)
        .resize({ width: 200, height: 200, fit: 'cover' })
        .webp({ quality: 60 })
        .toBuffer();

      const thumbFilename = `uploads/${fileId}_thumb.webp`;
      
      const { error: thumbUploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(thumbFilename, thumbBuffer, {
          contentType: 'image/webp',
          upsert: false
        });

      if (!thumbUploadError) {
        const { data: { publicUrl: thumbPublicUrl } } = supabase.storage
          .from(this.bucketName)
          .getPublicUrl(thumbFilename);
        thumbnailUrl = thumbPublicUrl;
      }
    }

    return mediaRepository.createFile({
      fileName: filename,
      originalName: file.originalname,
      folderId,
      mimeType: finalMimeType,
      sizeBytes: processedBuffer.length,
      url: publicUrl,
      thumbnailUrl,
      dimensions,
      storagePath: filePath, // Storing Supabase path in storagePath
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

    // Remove files from Supabase (ignore errors if already deleted)
    try {
      const pathsToRemove: string[] = [];
      if (file.storagePath) {
        pathsToRemove.push(file.storagePath);
      }
      if (file.thumbnailUrl && file.storagePath) {
        const thumbFilename = file.storagePath.replace(/\.[^/.]+$/, '') + '_thumb.webp';
        pathsToRemove.push(thumbFilename);
      }
      
      if (pathsToRemove.length > 0) {
        await supabase.storage.from(this.bucketName).remove(pathsToRemove);
      }
    } catch (err) {
      console.error('Failed to cleanup Supabase storage files', err);
    }

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
