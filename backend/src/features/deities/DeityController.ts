import { Request, Response, NextFunction } from 'express';
import { deityService } from './DeityService';
import { sendSuccess } from '@/responses/apiResponse';

export class DeityController {
  async getDeities(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, page, limit } = req.query;
      const result = await deityService.getDeities({
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return sendSuccess(res, 'Deities fetched', result.data, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getDeity(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await deityService.getDeity(req.params.id as string);
      return sendSuccess(res, 'Deity fetched', data);
    } catch (error) {
      next(error);
    }
  }

  async createDeity(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await deityService.createDeity(req.body, (req as any).user?.id);
      return sendSuccess(res, 'Deity created', data);
    } catch (error) {
      next(error);
    }
  }

  async updateDeity(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await deityService.updateDeity(req.params.id as string, req.body, (req as any).user?.id);
      return sendSuccess(res, 'Deity updated', data);
    } catch (error) {
      next(error);
    }
  }

  async deleteDeity(req: Request, res: Response, next: NextFunction) {
    try {
      await deityService.deleteDeity(req.params.id as string);
      return sendSuccess(res, 'Deity deleted', null);
    } catch (error) {
      next(error);
    }
  }

  async bulkAction(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids, action } = req.body;
      const userId = (req as any).user?.id;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new Error('Invalid IDs array');
      }
      
      if (action === 'DELETE') {
        await deityService.bulkDeleteDeities(ids);
      } else if (action === 'ACTIVATE') {
        await deityService.bulkEditDeities(ids, { status: 'ACTIVE' }, userId);
      } else if (action === 'DEACTIVATE') {
        await deityService.bulkEditDeities(ids, { status: 'INACTIVE' }, userId);
      } else {
         throw new Error('Invalid bulk action');
      }

      return sendSuccess(res, `Successfully triggered ${action} on ${ids.length} items`, {});
    } catch (error) {
      next(error);
    }
  }
}

export const deityController = new DeityController();
