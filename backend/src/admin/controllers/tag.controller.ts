import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../responses/apiResponse';
import { tagService } from '../../services/TagService';

class AdminTagController {
  public list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, total } = await tagService.getTags(req.query);
      return sendSuccess(res, 'Tags fetched', data, { total, page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 10 });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await tagService.getTag(req.params.id as string);
      return sendSuccess(res, 'Tag fetched', data);
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await tagService.createTag(req.body);
      return sendSuccess(res, 'Tag created', data);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await tagService.updateTag(req.params.id as string, req.body);
      return sendSuccess(res, 'Tag updated', data);
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await tagService.deleteTag(req.params.id as string);
      return sendSuccess(res, 'Tag deleted', null);
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
      
      if (action === 'DELETE') {
        await tagService.bulkDeleteTags(ids);
      } else if (action === 'ACTIVATE') {
        await tagService.bulkEditTags(ids, { status: 'ACTIVE' });
      } else if (action === 'DEACTIVATE') {
        await tagService.bulkEditTags(ids, { status: 'INACTIVE' });
      } else {
         throw new Error('Invalid bulk action');
      }

      return sendSuccess(res, `Successfully triggered ${action} on ${ids.length} items`, {});
    } catch (error) {
      next(error);
    }
  };
}

export const adminTagController = new AdminTagController();
