"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryService = exports.CategoryService = void 0;
const CategoryRepository_1 = require("./CategoryRepository");
const appError_1 = require("@/errors/appError");
class CategoryService {
    async getCategories(options) {
        return CategoryRepository_1.categoryRepository.findAll(options);
    }
    async getCategory(id) {
        const category = await CategoryRepository_1.categoryRepository.findById(id);
        if (!category)
            throw new appError_1.NotFoundError('Category not found');
        return category;
    }
    async createCategory(data) {
        if (!data.slug) {
            data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }
        return CategoryRepository_1.categoryRepository.create(data);
    }
    async updateCategory(id, data) {
        await this.getCategory(id);
        if (data.name && !data.slug) {
            data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }
        return CategoryRepository_1.categoryRepository.update(id, data);
    }
    async deleteCategory(id) {
        await this.getCategory(id);
        return CategoryRepository_1.categoryRepository.delete(id);
    }
    async bulkDeleteCategories(ids) {
        // Better implemented as a single query but keeping backward compatibility with service method signature
        for (const id of ids) {
            await CategoryRepository_1.categoryRepository.delete(id);
        }
    }
    async bulkEditCategories(ids, data) {
        for (const id of ids) {
            await CategoryRepository_1.categoryRepository.update(id, data);
        }
    }
}
exports.CategoryService = CategoryService;
exports.categoryService = new CategoryService();
