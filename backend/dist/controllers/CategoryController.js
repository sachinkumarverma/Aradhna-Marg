"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryController = exports.CategoryController = void 0;
const CategoryService_1 = require("../services/CategoryService");
const apiResponse_1 = require("../responses/apiResponse");
const category_validator_1 = require("../validators/category.validator");
const appError_1 = require("../errors/appError");
class CategoryController {
    async getCategories(req, res, next) {
        try {
            const { search, sort, order, page, limit } = req.query;
            const result = await CategoryService_1.categoryService.getCategories({
                search: search,
                sort: sort,
                order: order,
                page: page ? parseInt(page, 10) : undefined,
                limit: limit ? parseInt(limit, 10) : undefined,
            });
            return (0, apiResponse_1.sendSuccess)(res, 'Categories retrieved successfully', result.data, { total: result.total });
        }
        catch (error) {
            next(error);
        }
    }
    async getCategory(req, res, next) {
        try {
            const category = await CategoryService_1.categoryService.getCategory(req.params.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Category retrieved', category);
        }
        catch (error) {
            next(error);
        }
    }
    async createCategory(req, res, next) {
        try {
            const validatedData = category_validator_1.createCategorySchema.parse(req.body);
            const category = await CategoryService_1.categoryService.createCategory(validatedData);
            return (0, apiResponse_1.sendSuccess)(res, 'Category created successfully', category, undefined, 201);
        }
        catch (error) {
            next(error);
        }
    }
    async updateCategory(req, res, next) {
        try {
            const validatedData = category_validator_1.updateCategorySchema.parse(req.body);
            const category = await CategoryService_1.categoryService.updateCategory(req.params.id, validatedData);
            return (0, apiResponse_1.sendSuccess)(res, 'Category updated successfully', category);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteCategory(req, res, next) {
        try {
            await CategoryService_1.categoryService.deleteCategory(req.params.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Category deleted successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async bulkDeleteCategories(req, res, next) {
        try {
            const { ids } = req.body;
            if (!Array.isArray(ids))
                throw new appError_1.AppError('ids must be an array', 400);
            await CategoryService_1.categoryService.bulkDeleteCategories(ids);
            return (0, apiResponse_1.sendSuccess)(res, 'Categories deleted successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async bulkEditCategories(req, res, next) {
        try {
            const { ids, data } = req.body;
            if (!Array.isArray(ids))
                throw new appError_1.AppError('ids must be an array', 400);
            const validatedData = category_validator_1.updateCategorySchema.parse(data);
            await CategoryService_1.categoryService.bulkEditCategories(ids, validatedData);
            return (0, apiResponse_1.sendSuccess)(res, 'Categories updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CategoryController = CategoryController;
exports.categoryController = new CategoryController();
