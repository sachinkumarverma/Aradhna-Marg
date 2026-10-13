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
      sort: query.sort,
      missing: query.missing
    });
  }

  public async getById(id: string) {
    return articleRepository.getByIdWithRelations(id);
  }

  private parseTags(tags: any, customTagsExisting: any) {
    const isUUID = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const globalTagIds: string[] = [];
    const customTagNames: string[] = Array.isArray(customTagsExisting) ? [...customTagsExisting] : [];

    if (Array.isArray(tags)) {
      for (const t of tags) {
        if (typeof t === 'string' && isUUID(t)) {
          globalTagIds.push(t);
        } else if (typeof t === 'string' && t.trim()) {
          if (!customTagNames.includes(t.trim())) {
            customTagNames.push(t.trim());
          }
        }
      }
    }

    return { globalTagIds, customTagNames };
  }

  public async create(data: any) {
    const {
      deities,
      festivals,
      tags,
      bhajans,
      related_articles,
      image_url,
      categories,
      authors,
      media_files,
      article_gods,
      article_festivals,
      article_tags,
      article_bhajans,
      ...articleData
    } = data;

    const { globalTagIds, customTagNames } = this.parseTags(tags, articleData.custom_tags);
    articleData.custom_tags = customTagNames;

    articleData.featured_image_id = this.sanitizeUuid(articleData.featured_image_id);
    articleData.category_id = this.sanitizeUuid(articleData.category_id);
    articleData.author_id = this.sanitizeUuid(articleData.author_id);

    if (!articleData.slug && articleData.title) {
      articleData.slug = randomUUID();
    }
    if (articleData.status === 'PUBLISHED') {
      articleData.publish_date = new Date().toISOString();
    } else {
      articleData.publish_date = null;
    }

    const created = await articleRepository.create(articleData);

    await this.updateRelations(created.id, deities, festivals, globalTagIds, bhajans, related_articles);
    return created;
  }

  private sanitizeUuid(val: any): string | null {
    if (!val || (typeof val === 'string' && val.trim() === '')) return null;
    return val;
  }

  public async update(id: string, data: any) {
    const {
      deities,
      festivals,
      tags,
      bhajans,
      related_articles,
      image_url,
      categories,
      authors,
      media_files,
      article_gods,
      article_festivals,
      article_tags,
      article_bhajans,
      ...articleData
    } = data;

    const { globalTagIds, customTagNames } = this.parseTags(tags, articleData.custom_tags);
    articleData.custom_tags = customTagNames;

    if ('featured_image_id' in articleData) {
      articleData.featured_image_id = this.sanitizeUuid(articleData.featured_image_id);
    }
    if ('category_id' in articleData) {
      articleData.category_id = this.sanitizeUuid(articleData.category_id);
    }
    if ('author_id' in articleData) {
      articleData.author_id = this.sanitizeUuid(articleData.author_id);
    }

    const existing = await articleRepository.findById(id);
    if (articleData.status === 'PUBLISHED' && !existing?.publish_date) {
      articleData.publish_date = new Date().toISOString();
    } else if (articleData.status !== 'PUBLISHED') {
      articleData.publish_date = null;
    } else {
      delete articleData.publish_date; // Keep existing publish_date
    }
    const updated = await articleRepository.update(id, articleData);

    await this.updateRelations(id, deities, festivals, globalTagIds, bhajans, related_articles);
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

  public async updateSeo(id: string, seoTitle: string, seoDescription: string) {
    return articleRepository.updateSeo(id, seoTitle, seoDescription);
  }

  public async updateContentField(id: string, field: string, value: string) {
    return articleRepository.updateContentField(id, field, value);
  }
}

export const articleService = new ArticleService();
