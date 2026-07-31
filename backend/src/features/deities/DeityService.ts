import { deityRepository } from './DeityRepository';
import { CreateDeityDTO, UpdateDeityDTO, DeityQueryOptions } from './DeityDTO';

export class DeityService {
  async getDeities(options: DeityQueryOptions) {
    return deityRepository.findAll(options);
  }

  async getDeity(id: string) {
    return deityRepository.findById(id);
  }

  async createDeity(data: CreateDeityDTO, userId?: string) {
    if (!data.slug) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    return deityRepository.create({ ...data, createdBy: userId });
  }

  async updateDeity(id: string, data: UpdateDeityDTO, userId?: string) {
    if (data.name && !data.slug) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    return deityRepository.update(id, { ...data, updatedBy: userId });
  }

  async deleteDeity(id: string) {
    return deityRepository.delete(id);
  }

  async bulkDeleteDeities(ids: string[]) {
    for (const id of ids) {
      await deityRepository.delete(id);
    }
  }

  async bulkEditDeities(ids: string[], data: UpdateDeityDTO, userId?: string) {
    for (const id of ids) {
      await deityRepository.update(id, { ...data, updatedBy: userId });
    }
  }
}

export const deityService = new DeityService();
