import { categoryRepository } from '../repositories/CategoryRepository';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../models/Category';
import { NotFoundError } from '../errors/appError';

export class CategoryService {
  async getCategories(options: { search?: string, sort?: string, order?: 'asc' | 'desc', page?: number, limit?: number }) {
    return categoryRepository.findAll(options);
  }

  async getCategory(id: string) {
    const category = await categoryRepository.findById(id);
    if (!category) throw new NotFoundError('Category not found');
    return category;
  }

  async createCategory(data: CreateCategoryDTO) {
    // Generate slug from name if not provided
    if (!data.slug) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    return categoryRepository.create(data);
  }

  async updateCategory(id: string, data: UpdateCategoryDTO) {
    await this.getCategory(id); // Ensure exists
    
    if (data.name && !data.slug) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    return categoryRepository.update(id, data);
  }

  async deleteCategory(id: string) {
    await this.getCategory(id); // Ensure exists
    return categoryRepository.delete(id);
  }

  async bulkDeleteCategories(ids: string[]) {
    for (const id of ids) {
      await categoryRepository.delete(id);
    }
  }

  async bulkEditCategories(ids: string[], data: UpdateCategoryDTO) {
    for (const id of ids) {
      await categoryRepository.update(id, data);
    }
  }
}

export const categoryService = new CategoryService();
