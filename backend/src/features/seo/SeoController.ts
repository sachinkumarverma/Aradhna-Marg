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

  async getLatestAgentAudit(req: Request, res: Response, next: NextFunction) {
    try {
      const audit = await seoService.getLatestAgentAudit();
      return sendSuccess(res, 'Latest agent SEO audit retrieved', audit);
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
