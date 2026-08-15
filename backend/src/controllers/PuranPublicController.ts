import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/responses/apiResponse';
import { puranService } from '@services/PuranService';

class PuranPublicController {
  public getBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await puranService.getBySlug(req.params.slug as string);
      return sendSuccess(res, 'Purana fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  public getPdfUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const url = await puranService.getPdfUrl(req.params.id as string);
      return sendSuccess(res, 'PDF URL generated', { url });
    } catch (error) {
      next(error);
    }
  };

  public trackView = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await puranService.incrementView(req.params.id as string);
      return sendSuccess(res, 'View tracked', null);
    } catch (error) {
      next(error);
    }
  };

  public trackDownload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await puranService.incrementDownload(req.params.id as string);
      return sendSuccess(res, 'Download tracked', null);
    } catch (error) {
      next(error);
    }
  };
}

export const puranPublicController = new PuranPublicController();
