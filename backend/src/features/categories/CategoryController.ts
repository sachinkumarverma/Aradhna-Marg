import { Request, Response, NextFunction } from 'express';
import { categoryService } from './CategoryService';
import { sendSuccess } from '../../responses/apiResponse';
import { createCategorySchema, updateCategorySchema } from './CategoryValidator';
import { AppError } from '../../errors/appError';

export class CategoryController {
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, sort, order, page, limit } = req.query;
      const result = await categoryService.getCategories({
        search: search as string,
        sort: sort as string,
        order: order as 'asc' | 'desc',
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return sendSuccess(res, 'Categories retrieved successfully', result.data, { total: result.total });
    } catch (error) {
      next(error);
    }
  }

  async getCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.getCategory(req.params.id as string);
      return sendSuccess(res, 'Category retrieved', category);
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createCategorySchema.parse(req.body);
      const category = await categoryService.createCategory(validatedData as any);
      return sendSuccess(res, 'Category created successfully', category, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateCategorySchema.parse(req.body);
      const category = await categoryService.updateCategory(req.params.id as string, validatedData as any);
      return sendSuccess(res, 'Category updated successfully', category);
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      await categoryService.deleteCategory(req.params.id as string);
      return sendSuccess(res, 'Category deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async bulkDeleteCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) throw new AppError('ids must be an array', 400);
      await categoryService.bulkDeleteCategories(ids as string[]);
      return sendSuccess(res, 'Categories deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async bulkEditCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids, data } = req.body;
      if (!Array.isArray(ids)) throw new AppError('ids must be an array', 400);
      const validatedData = updateCategorySchema.parse(data);
      await categoryService.bulkEditCategories(ids as string[], validatedData as any);
      return sendSuccess(res, 'Categories updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
