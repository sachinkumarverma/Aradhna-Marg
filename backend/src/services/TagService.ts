import { tagRepository } from '../repositories/TagRepository';
import { CreateTagDTO, UpdateTagDTO } from '../models/Tag';
import { NotFoundError } from '../errors/appError';

export class TagService {
  async getTags(options: { search?: string, sort?: string, order?: 'asc' | 'desc', page?: number, limit?: number, status?: string }) {
    return tagRepository.findAll(options);
  }

  async getTag(id: string) {
    const tag = await tagRepository.findById(id);
    if (!tag) throw new NotFoundError('Tag not found');
    return tag;
  }

  async createTag(data: CreateTagDTO) {
    if (!data.slug) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    return tagRepository.create(data);
  }

  async updateTag(id: string, data: UpdateTagDTO) {
    await this.getTag(id); // Ensure exists
    
    if (data.name && !data.slug) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    return tagRepository.update(id, data);
  }

  async deleteTag(id: string) {
    await this.getTag(id); // Ensure exists
    return tagRepository.delete(id);
  }

  async bulkDeleteTags(ids: string[]) {
    for (const id of ids) {
      await tagRepository.delete(id);
    }
  }

  async bulkEditTags(ids: string[], data: UpdateTagDTO) {
    for (const id of ids) {
      await tagRepository.update(id, data);
    }
  }
}

export const tagService = new TagService();
