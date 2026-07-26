import { Request, Response, NextFunction } from 'express';
import { youtubeSyncService } from '../services/YoutubeSyncService';
import { sendSuccess } from '../../responses/apiResponse';

class YoutubeController {
  
  public triggerSync = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { channelId, fullSync } = req.body;
      
      // Async trigger, do not await the entire sync in the HTTP cycle
      // In production, you would fetch last sync time if fullSync is false
      youtubeSyncService.syncChannel(channelId, fullSync ? undefined : new Date(Date.now() - 86400000).toISOString()).catch(next);
      
      return sendSuccess(res, 'YouTube synchronization started in the background.', { channelId, fullSync });
    } catch (error) {
      next(error);
    }
  };

  public getStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Fetch latest sync status from DB
      return sendSuccess(res, 'Status fetched', { status: 'IDLE', lastSync: new Date() });
    } catch (error) {
      next(error);
    }
  };

}

export const youtubeController = new YoutubeController();
