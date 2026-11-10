import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/responses/apiResponse';
import { puranService } from '@services/PuranService';
import { publicCacheService } from '@services/PublicCacheService';

class PuranPublicController {
  public getBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      publicCacheService.setCacheHeaders(res, 120, 600);
      const slug = req.params.slug as string;
      const cacheKey = `puran_detail_${slug}`;
      const cached = publicCacheService.get<any>(cacheKey);
      if (cached) {
        return sendSuccess(res, 'Purana fetched successfully (cached)', cached.data);
      }

      const data = await puranService.getBySlug(slug);
      if (!data) {
        return res.status(404).json({ success: false, message: 'Purana not found' });
      }

      publicCacheService.set(cacheKey, data, 600);
      return sendSuccess(res, 'Purana fetched successfully', data);
    } catch (error: any) {
      if (error?.message === 'Purana not found') {
        return res.status(404).json({ success: false, message: 'Purana not found' });
      }
      next(error);
    }
  };

  public getPdfUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isDownload = req.query.download === 'true';
      const cacheKey = `puran_pdf_${req.params.id}_${isDownload}`;
      const cached = publicCacheService.get<any>(cacheKey);
      if (cached) {
        publicCacheService.setCacheHeaders(res, 300, 1800);
        return sendSuccess(res, 'PDF URL generated (cached)', cached.data);
      }

      const url = await puranService.getPdfUrl(req.params.id as string, isDownload);
      publicCacheService.set(cacheKey, { url }, 1800);
      publicCacheService.setCacheHeaders(res, 300, 1800);
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
