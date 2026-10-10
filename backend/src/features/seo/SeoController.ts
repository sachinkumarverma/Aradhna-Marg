import { Request, Response, NextFunction } from 'express';
import { seoService } from './SeoService';
import { sendSuccess } from '@/responses/apiResponse';

export class SeoController {
  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const overview = await seoService.getOverview();
      return sendSuccess(res, 'SEO Overview retrieved', overview);
    } catch (error) {
      next(error);
    }
  }

  async getIssues(req: Request, res: Response, next: NextFunction) {
    try {
      const issues = await seoService.getIssues();
      return sendSuccess(res, 'SEO Issues retrieved', issues);
    } catch (error) {
      next(error);
    }
  }

  async generateSitemap(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await seoService.generateSitemap();
      return sendSuccess(res, 'Sitemap generated successfully', data);
    } catch (error) {
      next(error);
    }
  }

  async generateRobots(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await seoService.generateRobots();
      return sendSuccess(res, 'robots.txt generated successfully', data);
    } catch (error) {
      next(error);
    }
  }

  async generateBulkSEO(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await seoService.generateBulkSEO(req.body);
      return sendSuccess(res, 'Bulk SEO generation started', data);
    } catch (error) {
      next(error);
    }
  }
}

export const seoController = new SeoController();
