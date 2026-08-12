import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/responses/apiResponse';
import { festivalService } from '@services/FestivalService';

class AdminFestivalController {
  public list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, count } = await festivalService.getList(req.query);
      return sendSuccess(res, 'Festivals fetched', data, { total: count, page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 10 });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await festivalService.getById(req.params.id as string);
      return sendSuccess(res, 'Festival fetched', data);
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await festivalService.create(req.body);
      return sendSuccess(res, 'Festival created', data);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Update Festival Payload:', req.body);
      const data = await festivalService.update(req.params.id as string, req.body);
      return sendSuccess(res, 'Festival updated', data);
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await festivalService.delete(req.params.id as string);
      return sendSuccess(res, 'Festival deleted', null);
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
      await festivalService.bulkAction(ids, action);
      return sendSuccess(res, `Successfully triggered ${action} on ${ids.length} items`, {});
    } catch (error) {
      next(error);
    }
  };
}

export const adminFestivalController = new AdminFestivalController();
