import { festivalRepository } from '@repositories/FestivalRepository';
import { CreateFestivalDTO, UpdateFestivalDTO, Festival } from '@models/Festival';

export class FestivalService {
  async getList(query: any): Promise<{ data: Festival[], count: number }> {
    const { search, sort, order, page, limit } = query;
    const { data, total } = await festivalRepository.findAll({
      search: search as string,
      sort: sort as string,
      order: order as 'asc' | 'desc',
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
    });

    return { data, count: total };
  }

  async getById(id: string): Promise<Festival> {
    const festival = await festivalRepository.findById(id);
    if (!festival) throw new Error('Festival not found');
    return festival;
  }

  async create(data: CreateFestivalDTO): Promise<Festival> {
    if (!data.slug) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    return festivalRepository.create(data);
  }

  async update(id: string, data: UpdateFestivalDTO): Promise<Festival> {
    if (data.name && !data.slug) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    return festivalRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await festivalRepository.delete(id);
  }
  
  async bulkAction(ids: string[], action: 'publish' | 'draft' | 'delete'): Promise<void> {
    await festivalRepository.bulkAction(ids, action);
  }
}

export const festivalService = new FestivalService();
