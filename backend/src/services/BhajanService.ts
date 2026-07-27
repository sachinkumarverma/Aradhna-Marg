import { bhajanRepository } from '../repositories/BhajanRepository';
import { slugify } from '../utils/slugify';

export class BhajanService {
  public async getList(query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    
    return bhajanRepository.getList({
      page,
      limit,
      search: query.search,
      status: query.status,
      category: query.category,
      primaryDeity: query.primaryDeity,
      sort: query.sort
    });
  }

  public async getById(id: string) {
    return bhajanRepository.getByIdWithRelations(id);
  }

  public async create(data: any) {
    const { additionalDeities, ...bhajanData } = data;
    
    if (!bhajanData.slug && bhajanData.title) {
      bhajanData.slug = slugify(bhajanData.title);
    }

    const created = await bhajanRepository.create(bhajanData);
    
    if (additionalDeities && Array.isArray(additionalDeities)) {
      await bhajanRepository.updateAdditionalDeities(created.id, additionalDeities);
    }
    
    return created;
  }

  public async update(id: string, data: any) {
    const { additionalDeities, ...bhajanData } = data;
    
    const updated = await bhajanRepository.update(id, bhajanData);
    
    if (additionalDeities && Array.isArray(additionalDeities)) {
      await bhajanRepository.updateAdditionalDeities(id, additionalDeities);
    }
    
    return updated;
  }

  public async delete(id: string) {
    return bhajanRepository.softDelete(id);
  }

  public async bulkAction(ids: string[], action: 'PUBLISH' | 'DRAFT' | 'ARCHIVE' | 'DELETE') {
    return bhajanRepository.bulkAction(ids, action);
  }
}

export const bhajanService = new BhajanService();
