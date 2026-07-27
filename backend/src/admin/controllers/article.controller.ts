import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../responses/apiResponse';
import { articleService } from '../../services/ArticleService';

class AdminArticleController {
  public list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, count } = await articleService.getList(req.query);
      return sendSuccess(res, 'Articles fetched', {
        data,
        meta: { total: count, page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 10 }
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await articleService.getById(req.params.id as string);
      return sendSuccess(res, 'Article fetched', data);
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await articleService.create(req.body);
      return sendSuccess(res, 'Article created', data);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await articleService.update(req.params.id as string, req.body);
      return sendSuccess(res, 'Article updated', data);
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await articleService.delete(req.params.id as string);
      return sendSuccess(res, 'Article deleted', null);
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
      await articleService.bulkAction(ids, action);
      return sendSuccess(res, `Successfully triggered ${action} on ${ids.length} items`, {});
    } catch (error) {
      next(error);
    }
  };
}

export const adminArticleController = new AdminArticleController();
