import { Request, Response, NextFunction } from 'express';
import { mediaService } from '@services/MediaService';
import { sendSuccess } from '@/responses/apiResponse';
import { AppError } from '@/errors/appError';

export class MediaController {
  // Folders
  async createFolder(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, parentId } = req.body;
      if (!name) throw new AppError('Folder name is required', 400);
      const folder = await mediaService.createFolder(name as string, parentId as string | undefined);
      return sendSuccess(res, 'Folder created successfully', folder);
    } catch (error) {
      next(error);
    }
  }

  async getFolders(req: Request, res: Response, next: NextFunction) {
    try {
      const { parentId } = req.query;
      const folders = await mediaService.getFolders(parentId as string | undefined);
      return sendSuccess(res, 'Folders retrieved', folders);
    } catch (error) {
      next(error);
    }
  }

  async renameFolder(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { name } = req.body;
      if (!name) throw new AppError('New name is required', 400);
      const folder = await mediaService.renameFolder(id, name as string);
      return sendSuccess(res, 'Folder renamed', folder);
    } catch (error) {
      next(error);
    }
  }

  async deleteFolder(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await mediaService.deleteFolder(id);
      return sendSuccess(res, 'Folder deleted');
    } catch (error) {
      next(error);
    }
  }

  // Files
  async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      const { folderId } = req.body;
      if (!file) throw new AppError('No file uploaded', 400);

      const uploadedFile = await mediaService.uploadFile(file, folderId as string | undefined);
      return sendSuccess(res, 'File uploaded successfully', uploadedFile);
    } catch (error) {
      next(error);
    }
  }

  async getFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const { folderId, search } = req.query;
      const files = await mediaService.getFiles(folderId as string | undefined, search as string | undefined);
      return sendSuccess(res, 'Files retrieved', files);
    } catch (error) {
      next(error);
    }
  }

  async renameFile(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { name } = req.body;
      if (!name) throw new AppError('New name is required', 400);
      const file = await mediaService.renameFile(id, name as string);
      return sendSuccess(res, 'File renamed', file);
    } catch (error) {
      next(error);
    }
  }

  async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await mediaService.deleteFile(id);
      return sendSuccess(res, 'File deleted');
    } catch (error) {
      next(error);
    }
  }

  async bulkDeleteFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) throw new AppError('ids must be an array', 400);
      await mediaService.bulkDeleteFiles(ids as string[]);
      return sendSuccess(res, 'Files deleted');
    } catch (error) {
      next(error);
    }
  }

  async bulkMoveFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids, newFolderId } = req.body;
      if (!Array.isArray(ids)) throw new AppError('ids must be an array', 400);
      await mediaService.bulkMoveFiles(ids as string[], newFolderId as string | null);
      return sendSuccess(res, 'Files moved');
    } catch (error) {
      next(error);
    }
  }
}

export const mediaController = new MediaController();
