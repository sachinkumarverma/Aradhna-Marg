import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../responses/apiResponse';
import { DeityService } from '../services/DeityService';

class AdminDeityController {
  private service: DeityService;

  constructor() {
    this.service = new DeityService();
  }

  public list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      const { data, meta } = await this.service.getAllDeities(page, limit, search);
      return sendSuccess(res, 'Deities fetched', { data, meta });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getDeityById(req.params.id);
      return sendSuccess(res, 'Deity fetched', data);
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id || 'system';
      const data = await this.service.createDeity(req.body, userId);
      return sendSuccess(res, 'Deity created', data);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id || 'system';
      const data = await this.service.updateDeity(req.params.id, req.body, userId);
      return sendSuccess(res, 'Deity updated', data);
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteDeity(req.params.id);
      return sendSuccess(res, 'Deity deleted', null);
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
      
      // We will implement bulk actions in the service if needed,
      // but for now we can just loop over them since this is an admin tool.
      for (const id of ids) {
        if (action === 'DELETE') {
          await this.service.deleteDeity(id);
        } else if (action === 'ACTIVATE') {
          await this.service.updateDeity(id, { status: 'ACTIVE' }, (req as any).user?.id || 'system');
        } else if (action === 'DEACTIVATE') {
          await this.service.updateDeity(id, { status: 'INACTIVE' }, (req as any).user?.id || 'system');
        }
      }
      
      return sendSuccess(res, `Successfully triggered ${action} on ${ids.length} items`, {});
    } catch (error) {
      next(error);
    }
  };
}

export const adminDeityController = new AdminDeityController();
