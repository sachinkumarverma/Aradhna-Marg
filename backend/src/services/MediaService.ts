import { mediaRepository } from '../repositories/MediaRepository';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Handles saving uploaded files to local disk and serving them.
 * Files are saved to <project-root>/backend/public/uploads/
 * and served as static files via Express.
 */
export class MediaService {
  // Absolute path to the uploads directory
  private readonly uploadDir: string;
  // Public URL prefix (served by Express static middleware)
  private readonly publicPrefix: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
    this.publicPrefix = '/uploads';

    // Ensure directory exists on startup
    fs.mkdirSync(this.uploadDir, { recursive: true });
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

      // Generate thumbnail
      const thumbBuffer = await sharp(file.buffer)
        .resize({ width: 200, height: 200, fit: 'cover' })
        .webp({ quality: 60 })
        .toBuffer();

      const thumbFilename = `${fileId}_thumb.webp`;
      const thumbPath = path.join(this.uploadDir, thumbFilename);
      fs.writeFileSync(thumbPath, thumbBuffer);
      thumbnailUrl = `${this.publicPrefix}/${thumbFilename}`;
    }

    // Save main file to disk
    const filename = `${fileId}.${finalExt}`;
    const filePath = path.join(this.uploadDir, filename);
    fs.writeFileSync(filePath, processedBuffer);
    const publicUrl = `${this.publicPrefix}/${filename}`;

    return mediaRepository.createFile({
      fileName: `${fileId}.${finalExt}`,
      originalName: file.originalname,
      folderId,
      mimeType: finalMimeType,
      sizeBytes: processedBuffer.length,
      url: publicUrl,
      thumbnailUrl,
      dimensions,
      storagePath: filePath,
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

    // Remove physical files from disk (ignore errors if already deleted)
    try {
      if (file.storagePath && fs.existsSync(file.storagePath)) {
        fs.unlinkSync(file.storagePath);
      }
      if (file.thumbnailUrl) {
        const thumbFilename = path.basename(file.storagePath).replace(/\.[^/.]+$/, '') + '_thumb.webp';
        const thumbPath = path.join(this.uploadDir, thumbFilename);
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
      }
    } catch {
      // Best-effort cleanup
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
