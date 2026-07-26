"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaController = exports.MediaController = void 0;
const MediaService_1 = require("../services/MediaService");
const apiResponse_1 = require("../responses/apiResponse");
const appError_1 = require("../errors/appError");
class MediaController {
    // Folders
    async createFolder(req, res, next) {
        try {
            const { name, parentId } = req.body;
            if (!name)
                throw new appError_1.AppError('Folder name is required', 400);
            const folder = await MediaService_1.mediaService.createFolder(name, parentId);
            return (0, apiResponse_1.sendSuccess)(res, 'Folder created successfully', folder);
        }
        catch (error) {
            next(error);
        }
    }
    async getFolders(req, res, next) {
        try {
            const { parentId } = req.query;
            const folders = await MediaService_1.mediaService.getFolders(parentId);
            return (0, apiResponse_1.sendSuccess)(res, 'Folders retrieved', folders);
        }
        catch (error) {
            next(error);
        }
    }
    async renameFolder(req, res, next) {
        try {
            const id = req.params.id;
            const { name } = req.body;
            if (!name)
                throw new appError_1.AppError('New name is required', 400);
            const folder = await MediaService_1.mediaService.renameFolder(id, name);
            return (0, apiResponse_1.sendSuccess)(res, 'Folder renamed', folder);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteFolder(req, res, next) {
        try {
            const id = req.params.id;
            await MediaService_1.mediaService.deleteFolder(id);
            return (0, apiResponse_1.sendSuccess)(res, 'Folder deleted');
        }
        catch (error) {
            next(error);
        }
    }
    // Files
    async uploadFile(req, res, next) {
        try {
            const file = req.file;
            const { folderId } = req.body;
            if (!file)
                throw new appError_1.AppError('No file uploaded', 400);
            const uploadedFile = await MediaService_1.mediaService.uploadFile(file, folderId);
            return (0, apiResponse_1.sendSuccess)(res, 'File uploaded successfully', uploadedFile);
        }
        catch (error) {
            next(error);
        }
    }
    async getFiles(req, res, next) {
        try {
            const { folderId, search } = req.query;
            const files = await MediaService_1.mediaService.getFiles(folderId, search);
            return (0, apiResponse_1.sendSuccess)(res, 'Files retrieved', files);
        }
        catch (error) {
            next(error);
        }
    }
    async renameFile(req, res, next) {
        try {
            const id = req.params.id;
            const { name } = req.body;
            if (!name)
                throw new appError_1.AppError('New name is required', 400);
            const file = await MediaService_1.mediaService.renameFile(id, name);
            return (0, apiResponse_1.sendSuccess)(res, 'File renamed', file);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteFile(req, res, next) {
        try {
            const id = req.params.id;
            await MediaService_1.mediaService.deleteFile(id);
            return (0, apiResponse_1.sendSuccess)(res, 'File deleted');
        }
        catch (error) {
            next(error);
        }
    }
    async bulkDeleteFiles(req, res, next) {
        try {
            const { ids } = req.body;
            if (!Array.isArray(ids))
                throw new appError_1.AppError('ids must be an array', 400);
            await MediaService_1.mediaService.bulkDeleteFiles(ids);
            return (0, apiResponse_1.sendSuccess)(res, 'Files deleted');
        }
        catch (error) {
            next(error);
        }
    }
    async bulkMoveFiles(req, res, next) {
        try {
            const { ids, newFolderId } = req.body;
            if (!Array.isArray(ids))
                throw new appError_1.AppError('ids must be an array', 400);
            await MediaService_1.mediaService.bulkMoveFiles(ids, newFolderId);
            return (0, apiResponse_1.sendSuccess)(res, 'Files moved');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.MediaController = MediaController;
exports.mediaController = new MediaController();
