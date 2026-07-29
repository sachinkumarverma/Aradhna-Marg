import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../responses/apiResponse';
import { authorService } from '../../services/AuthorService';

class AdminAuthorController {
  public list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, total } = await authorService.getAuthors(req.query);
      return sendSuccess(res, 'Authors fetched', data, { total, page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 10 });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await authorService.getAuthor(req.params.id as string);
      return sendSuccess(res, 'Author fetched', data);
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await authorService.createAuthor(req.body);
      return sendSuccess(res, 'Author created', data);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await authorService.updateAuthor(req.params.id as string, req.body);
      return sendSuccess(res, 'Author updated', data);
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authorService.deleteAuthor(req.params.id as string);
      return sendSuccess(res, 'Author deleted', null);
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
        await authorService.bulkDeleteAuthors(ids);
      } else if (action === 'ACTIVATE') {
        await authorService.bulkEditAuthors(ids, { status: 'ACTIVE' });
      } else if (action === 'DEACTIVATE') {
        await authorService.bulkEditAuthors(ids, { status: 'INACTIVE' });
      } else {
         throw new Error('Invalid bulk action');
      }
      
      return sendSuccess(res, `Successfully triggered ${action} on ${ids.length} items`, {});
    } catch (error) {
      next(error);
    }
  };
}

export const adminAuthorController = new AdminAuthorController();
