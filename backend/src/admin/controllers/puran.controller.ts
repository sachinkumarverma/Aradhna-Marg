import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/responses/apiResponse';
import { puranService } from '@services/PuranService';

class AdminPuranController {
  public list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, count } = await puranService.getList(req.query);
      return sendSuccess(res, 'Puranas fetched', data, {
        total: count,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await puranService.getById(req.params.id as string);
      return sendSuccess(res, 'Purana fetched', data);
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await puranService.create(req.body);
      return sendSuccess(res, 'Purana created', data);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await puranService.update(req.params.id as string, req.body);
      return sendSuccess(res, 'Purana updated', data);
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await puranService.delete(req.params.id as string);
      return sendSuccess(res, 'Purana deleted', null);
    } catch (error) {
      next(error);
    }
  };

  public bulkAction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids, action } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new Error('Invalid IDs array');
      }
      await puranService.bulkAction(ids, action);
      return sendSuccess(res, `Successfully triggered ${action} on ${ids.length} items`, {});
    } catch (error) {
      next(error);
    }
  };
}

export const adminPuranController = new AdminPuranController();
