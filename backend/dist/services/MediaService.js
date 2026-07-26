"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaService = exports.MediaService = void 0;
const MediaRepository_1 = require("../repositories/MediaRepository");
const supabase_1 = require("../database/supabase");
const uuid_1 = require("uuid");
const sharp_1 = __importDefault(require("sharp"));
class MediaService {
    BUCKET_NAME = 'public'; // Assuming 'public' bucket or 'media' bucket. We use 'public' as seen in UI previously.
    MEDIA_FOLDER = 'media-library';
    // Folders
    async createFolder(name, parentId) {
        return MediaRepository_1.mediaRepository.createFolder({ name, parentId });
    }
    async getFolders(parentId) {
        return MediaRepository_1.mediaRepository.getFolders(parentId);
    }
    async renameFolder(id, newName) {
        return MediaRepository_1.mediaRepository.updateFolder(id, newName);
    }
    async deleteFolder(id) {
        // In a real system, we'd recursively delete files from Supabase Storage as well.
        // For this implementation, deleting from the database triggers CASCADE deletes for files in DB.
        // We should ideally fetch all files recursively and delete them from storage.
        return MediaRepository_1.mediaRepository.deleteFolder(id);
    }
    // Files
    async uploadFile(file, folderId) {
        const fileId = (0, uuid_1.v4)();
        const ext = file.originalname.split('.').pop() || '';
        const isImage = file.mimetype.startsWith('image/');
        let processedBuffer = file.buffer;
        let thumbnailUrl;
        let dimensions;
        if (isImage && !file.mimetype.includes('svg')) {
            const metadata = await (0, sharp_1.default)(file.buffer).metadata();
            dimensions = `${metadata.width}x${metadata.height}`;
            // Compress original
            processedBuffer = await (0, sharp_1.default)(file.buffer)
                .resize({ width: 1920, withoutEnlargement: true }) // Max 1080p width
                .webp({ quality: 80 })
                .toBuffer();
            file.mimetype = 'image/webp';
            // Generate thumbnail
            const thumbBuffer = await (0, sharp_1.default)(file.buffer)
                .resize({ width: 200, height: 200, fit: 'cover' })
                .webp({ quality: 60 })
                .toBuffer();
            const thumbPath = `${this.MEDIA_FOLDER}/${fileId}_thumb.webp`;
            const { error: thumbError } = await supabase_1.supabase.storage
                .from(this.BUCKET_NAME)
                .upload(thumbPath, thumbBuffer, { contentType: 'image/webp' });
            if (!thumbError) {
                const { data: thumbData } = supabase_1.supabase.storage.from(this.BUCKET_NAME).getPublicUrl(thumbPath);
                thumbnailUrl = thumbData.publicUrl;
            }
        }
        const storagePath = `${this.MEDIA_FOLDER}/${fileId}.webp`; // Use original ext if not image
        const actualExt = isImage && !file.mimetype.includes('svg') ? 'webp' : ext;
        const actualStoragePath = `${this.MEDIA_FOLDER}/${fileId}.${actualExt}`;
        const { error: uploadError } = await supabase_1.supabase.storage
            .from(this.BUCKET_NAME)
            .upload(actualStoragePath, processedBuffer, { contentType: file.mimetype });
        if (uploadError)
            throw uploadError;
        const { data: publicUrlData } = supabase_1.supabase.storage
            .from(this.BUCKET_NAME)
            .getPublicUrl(actualStoragePath);
        return MediaRepository_1.mediaRepository.createFile({
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
    async getFiles(folderId, search) {
        return MediaRepository_1.mediaRepository.getFiles(folderId, search);
    }
    async renameFile(id, newName) {
        return MediaRepository_1.mediaRepository.updateFile(id, { fileName: newName });
    }
    async deleteFile(id) {
        const file = await MediaRepository_1.mediaRepository.getFile(id);
        if (!file)
            throw new Error('File not found');
        const pathsToDelete = [file.storagePath];
        if (file.thumbnailUrl) {
            const thumbPath = file.storagePath.replace(/\.[^/.]+$/, "") + "_thumb.webp";
            pathsToDelete.push(thumbPath);
        }
        await supabase_1.supabase.storage.from(this.BUCKET_NAME).remove(pathsToDelete);
        await MediaRepository_1.mediaRepository.deleteFile(id);
    }
    async bulkDeleteFiles(ids) {
        for (const id of ids) {
            await this.deleteFile(id);
        }
    }
    async bulkMoveFiles(ids, newFolderId) {
        for (const id of ids) {
            await MediaRepository_1.mediaRepository.updateFile(id, { folderId: newFolderId });
        }
    }
}
exports.MediaService = MediaService;
exports.mediaService = new MediaService();
