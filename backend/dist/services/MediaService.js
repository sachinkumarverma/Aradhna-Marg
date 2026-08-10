"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaService = exports.MediaService = void 0;
const MediaRepository_1 = require("@repositories/MediaRepository");
const uuid_1 = require("uuid");
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
/**
 * Handles saving uploaded files to local disk and serving them.
 * Files are saved to <project-root>/backend/public/uploads/
 * and served as static files via Express.
 */
class MediaService {
    // Absolute path to the uploads directory
    uploadDir;
    // Public URL prefix (served by Express static middleware)
    publicPrefix;
    constructor() {
        this.uploadDir = path_1.default.join(process.cwd(), 'public', 'uploads');
        this.publicPrefix = '/uploads';
        // Ensure directory exists on startup
        fs_1.default.mkdirSync(this.uploadDir, { recursive: true });
    }
    // ── Folders ─────────────────────────────────────────────────────────────────
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
        // For simplicity we soft-delete from DB; physical cleanup can be a scheduled job
        return MediaRepository_1.mediaRepository.deleteFolder(id);
    }
    // ── Files ────────────────────────────────────────────────────────────────────
    async uploadFile(file, folderId) {
        const fileId = (0, uuid_1.v4)();
        const ext = file.originalname.split('.').pop() || 'bin';
        const isImage = file.mimetype.startsWith('image/') && !file.mimetype.includes('svg');
        let processedBuffer = file.buffer;
        let thumbnailUrl;
        let dimensions;
        let finalExt = ext;
        let finalMimeType = file.mimetype;
        if (isImage) {
            const metadata = await (0, sharp_1.default)(file.buffer).metadata();
            dimensions = `${metadata.width}x${metadata.height}`;
            // Compress original to WebP
            processedBuffer = await (0, sharp_1.default)(file.buffer)
                .resize({ width: 1920, withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();
            finalExt = 'webp';
            finalMimeType = 'image/webp';
            // Generate thumbnail
            const thumbBuffer = await (0, sharp_1.default)(file.buffer)
                .resize({ width: 200, height: 200, fit: 'cover' })
                .webp({ quality: 60 })
                .toBuffer();
            const thumbFilename = `${fileId}_thumb.webp`;
            const thumbPath = path_1.default.join(this.uploadDir, thumbFilename);
            fs_1.default.writeFileSync(thumbPath, thumbBuffer);
            thumbnailUrl = `${this.publicPrefix}/${thumbFilename}`;
        }
        // Save main file to disk
        const filename = `${fileId}.${finalExt}`;
        const filePath = path_1.default.join(this.uploadDir, filename);
        fs_1.default.writeFileSync(filePath, processedBuffer);
        const publicUrl = `${this.publicPrefix}/${filename}`;
        return MediaRepository_1.mediaRepository.createFile({
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
        // Remove physical files from disk (ignore errors if already deleted)
        try {
            if (file.storagePath && fs_1.default.existsSync(file.storagePath)) {
                fs_1.default.unlinkSync(file.storagePath);
            }
            if (file.thumbnailUrl) {
                const thumbFilename = path_1.default.basename(file.storagePath).replace(/\.[^/.]+$/, '') + '_thumb.webp';
                const thumbPath = path_1.default.join(this.uploadDir, thumbFilename);
                if (fs_1.default.existsSync(thumbPath))
                    fs_1.default.unlinkSync(thumbPath);
            }
        }
        catch {
            // Best-effort cleanup
        }
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
