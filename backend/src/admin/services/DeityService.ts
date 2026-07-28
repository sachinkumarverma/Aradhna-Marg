import { DeityRepository } from '../repositories/DeityRepository';
import { CreateDeityDTO, UpdateDeityDTO } from '../../models/Deity';

export class DeityService {
  private repository: DeityRepository;

  constructor() {
    this.repository = new DeityRepository();
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  async getAllDeities(page: number, limit: number, search?: string) {
    return this.repository.findAll(page, limit, search);
  }

  async getDeityById(id: string) {
    return this.repository.findById(id);
  }

  async createDeity(data: CreateDeityDTO, userId: string) {
    if (!data.slug) {
      data.slug = this.generateSlug(data.name);
    }
    
    // Check slug uniqueness
    const existing = await this.repository.findBySlug(data.slug);
    if (existing) {
      data.slug = `${data.slug}-${Math.floor(Math.random() * 1000)}`;
    }

    return this.repository.create({
      ...data,
      createdBy: userId,
      status: data.status || 'ACTIVE',
      featured: data.featured || false
    });
  }

  async updateDeity(id: string, data: UpdateDeityDTO, userId: string) {
    if (data.name && !data.slug) {
      data.slug = this.generateSlug(data.name);
    }
    
    if (data.slug) {
      const existing = await this.repository.findBySlug(data.slug);
      if (existing && existing.id !== id) {
        data.slug = `${data.slug}-${Math.floor(Math.random() * 1000)}`;
      }
    }

    return this.repository.update(id, {
      ...data,
      updatedBy: userId
    });
  }

  async deleteDeity(id: string) {
    return this.repository.delete(id);
  }
}
