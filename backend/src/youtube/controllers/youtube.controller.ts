import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../responses/apiResponse';
import { youtubeService } from '../services/youtube.service';

export class YoutubeController {
  async getVideos(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string;
      const status = req.query.status as string;
      const videos = await youtubeService.getVideos(search, status);
      return sendSuccess(res, 'Videos retrieved', videos);
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

  async syncNow(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await youtubeService.syncNow();
      return sendSuccess(res, 'Sync triggered successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

export const youtubeController = new YoutubeController();
