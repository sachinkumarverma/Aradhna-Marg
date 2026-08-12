import { Request, Response, NextFunction } from 'express';
import { tagService } from './TagService';
import { sendSuccess } from '@/responses/apiResponse';

export class TagController {
  async getTags(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, sort, order, page, limit, status } = req.query;
      const result = await tagService.getTags({
        search: search as string,
        sort: sort as string,
        order: order as 'asc' | 'desc',
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        status: status as string
      });
      return sendSuccess(res, 'Tags retrieved successfully', result.data, { total: result.total });
    } catch (error) {
      next(error);
    }
  }

  async getTag(req: Request, res: Response, next: NextFunction) {
    try {
      const tag = await tagService.getTag(req.params.id as string);
      return sendSuccess(res, 'Tag retrieved', tag);
    } catch (error) {
      next(error);
    }
  }

  async createTag(req: Request, res: Response, next: NextFunction) {
    try {
      const tag = await tagService.createTag(req.body);
      return sendSuccess(res, 'Tag created successfully', tag, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateTag(req: Request, res: Response, next: NextFunction) {
    try {
      const tag = await tagService.updateTag(req.params.id as string, req.body);
      return sendSuccess(res, 'Tag updated successfully', tag);
    } catch (error) {
      next(error);
    }
  }

  async deleteTag(req: Request, res: Response, next: NextFunction) {
    try {
      await tagService.deleteTag(req.params.id as string);
      return sendSuccess(res, 'Tag deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async bulkAction(req: Request, res: Response, next: NextFunction) {
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
  }
}

export const tagController = new TagController();
