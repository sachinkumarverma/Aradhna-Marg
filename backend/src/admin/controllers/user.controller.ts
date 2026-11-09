import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/responses/apiResponse';
import { adminUserService } from '@admin/services/AdminUserService';

class AdminUserController {
  public list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await adminUserService.listUsers(req.query as any);
      return sendSuccess(res, 'Users fetched successfully', result.users, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      });
    } catch (error) {
      next(error);
    }
  };

  public getStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await adminUserService.getStats();
      return sendSuccess(res, 'User statistics fetched successfully', stats);
    } catch (error) {
      next(error);
    }
  };

  public toggleStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const { is_active } = req.body;
      const updated = await adminUserService.toggleStatus(id, Boolean(is_active));
      return sendSuccess(res, `User ${updated.is_active ? 'activated' : 'deactivated'} successfully`, updated);
    } catch (error) {
      next(error);
    }
  };
}

export const adminUserController = new AdminUserController();
