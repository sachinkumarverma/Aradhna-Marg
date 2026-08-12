import { randomUUID } from 'crypto';
import { articleRepository } from '@repositories/ArticleRepository';
import { slugify } from '@utils/slugify';

export class ArticleService {
  public async getList(query: any) {
    return articleRepository.getList({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      search: query.search,
      status: query.status,
      category: query.category,
      author: query.author,
      featured: query.featured,
      sort: query.sort
    });
  }

  public async getById(id: string) {
    return articleRepository.getByIdWithRelations(id);
  }

  public async create(data: any) {
    const { deities, festivals, tags, bhajans, related_articles, ...articleData } = data;

    if (!articleData.slug && articleData.title) {
      articleData.slug = randomUUID();
    }

    const created = await articleRepository.create(articleData);

    await this.updateRelations(created.id, deities, festivals, tags, bhajans, related_articles);
    return created;
  }

  public async update(id: string, data: any) {
    const { deities, festivals, tags, bhajans, related_articles, ...articleData } = data;

    const updated = await articleRepository.update(id, articleData);

    await this.updateRelations(id, deities, festivals, tags, bhajans, related_articles);
    return updated;
  }

  private async updateRelations(
    id: string,
    deities: any,
    festivals: any,
    tags: any,
    bhajans: any,
    related_articles: any
  ) {
    if (deities) await articleRepository.updateJunctionTable('article_gods', id, 'god_id', deities);
    if (festivals) await articleRepository.updateJunctionTable('article_festivals', id, 'festival_id', festivals);
    if (tags) await articleRepository.updateJunctionTable('article_tags', id, 'tag_id', tags);
    if (bhajans) await articleRepository.updateJunctionTable('article_bhajans', id, 'bhajan_id', bhajans);
    if (related_articles)
      await articleRepository.updateJunctionTable('related_articles', id, 'related_id', related_articles);
  }

  public async delete(id: string) {
    return articleRepository.update(id, { deleted_at: new Date().toISOString() });
  }

  public async bulkAction(ids: string[], action: string) {
    return articleRepository.bulkAction(ids, action);
  }
}

export const articleService = new ArticleService();
