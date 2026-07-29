import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../responses/apiResponse';
import { bhajanService } from '../../services/BhajanService';

class AdminBhajanController {
  public list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, count } = await bhajanService.getList(req.query);
      return sendSuccess(res, 'Bhajans fetched', data, { total: count, page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 10 });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await bhajanService.getById(req.params.id as string);
      return sendSuccess(res, 'Bhajan fetched', data);
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await bhajanService.create(req.body);
      return sendSuccess(res, 'Bhajan created', data);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await bhajanService.update(req.params.id as string, req.body);
      return sendSuccess(res, 'Bhajan updated', data);
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await bhajanService.delete(req.params.id as string);
      return sendSuccess(res, 'Bhajan deleted', null);
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
      await bhajanService.bulkAction(ids, action);
      return sendSuccess(res, `Successfully triggered ${action} on ${ids.length} items`, {});
    } catch (error) {
      next(error);
    }
  };
}

export const adminBhajanController = new AdminBhajanController();
