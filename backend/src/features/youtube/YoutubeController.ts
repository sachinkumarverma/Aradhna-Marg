import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/responses/apiResponse';
import { youtubeService } from './YoutubeService';

export class YoutubeController {
  async getVideos(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string;
      const status = req.query.status as string;
      const type = req.query.type as string;
      const sortBy = (req.query.sortBy as string) || 'published_at';
      const sortOrder = (req.query.sortOrder as string) || 'desc';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { data, total } = await youtubeService.getVideos(search, status, type, sortBy, sortOrder, page, limit);
      return sendSuccess(res, 'Videos retrieved', data, { total, page, limit });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await youtubeService.getStats();
      return sendSuccess(res, 'Stats retrieved', stats);
    } catch (error) {
      next(error);
    }
  }

  async getSyncHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const history = await youtubeService.getSyncHistory();
      return sendSuccess(res, 'History retrieved', history);
    } catch (error) {
      next(error);
    }
  }

  async syncNow(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await youtubeService.syncNow();
      return sendSuccess(res, 'Sync triggered successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async linkBhajan(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { bhajanId } = req.body;
      const result = await youtubeService.linkBhajan(id as string, bhajanId || null);
      return sendSuccess(res, 'Bhajan linked successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await youtubeService.updateStatus(id as string, status);
      return sendSuccess(res, 'Status updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async deleteVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await youtubeService.deleteVideo(id as string);
      return sendSuccess(res, 'Video deleted', result);
    } catch (error) {
      next(error);
    }
  }

  async getBhajansForLink(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await youtubeService.getBhajansForLink();
      return sendSuccess(res, 'Bhajans fetched', result);
    } catch (error) {
      next(error);
    }
  }
}

export const youtubeController = new YoutubeController();
