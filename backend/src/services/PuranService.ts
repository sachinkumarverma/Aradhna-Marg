import { puranRepository } from '../repositories/PuranRepository';
import { slugify } from '../utils/slugify';

export class PuranService {
  public async getList(query: any) {
    return puranRepository.getList({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      search: query.search,
      status: query.status,
      language: query.language,
      sort: query.sort
    });
  }

  public async getById(id: string) {
    return puranRepository.getById(id);
  }

  public async create(data: any) {
    if (!data.slug && data.title) {
      data.slug = slugify(data.title);
    }
    return puranRepository.create(data);
  }

  public async update(id: string, data: any) {
    if (data.title && !data.slug) {
        data.slug = slugify(data.title);
    }
    return puranRepository.update(id, data);
  }

  public async delete(id: string) {
    return puranRepository.update(id, { deleted_at: new Date().toISOString() });
  }

  public async bulkAction(ids: string[], action: string) {
    return puranRepository.bulkAction(ids, action);
  }

  public async getBySlug(slug: string) {
    const data = await puranRepository.getBySlug(slug);
    if (!data) throw new Error('Purana not found');
    const related = await puranRepository.getRelated(data.id, data.language || '');
    return { ...data, related };
  }

  public async incrementView(id: string) {
    return puranRepository.incrementStats(id, 'view_count');
  }

  public async incrementDownload(id: string) {
    return puranRepository.incrementStats(id, 'download_count');
  }
}

export const puranService = new PuranService();
