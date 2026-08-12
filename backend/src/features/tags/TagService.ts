import { randomUUID } from 'crypto';
import { tagRepository } from './TagRepository';
import { CreateTagDTO, UpdateTagDTO, TagQueryOptions } from './TagDTO';
import { NotFoundError } from '@/errors/appError';

export class TagService {
  async getTags(options: TagQueryOptions) {
    return tagRepository.findAll(options);
  }

  async getTag(id: string) {
    const tag = await tagRepository.findById(id);
    if (!tag) throw new NotFoundError('Tag not found');
    return tag;
  }

  async createTag(data: CreateTagDTO) {
    if (!data.slug) {
      data.slug = randomUUID();
    }
    return tagRepository.create(data);
  }

  async updateTag(id: string, data: UpdateTagDTO) {
    await this.getTag(id);
    
    if (data.name && !data.slug) {
      data.slug = randomUUID();
    }
    return tagRepository.update(id, data);
  }

  async deleteTag(id: string) {
    await this.getTag(id);
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
