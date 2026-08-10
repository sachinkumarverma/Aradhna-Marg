"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.articleService = exports.ArticleService = void 0;
const ArticleRepository_1 = require("@repositories/ArticleRepository");
const slugify_1 = require("@utils/slugify");
class ArticleService {
    async getList(query) {
        return ArticleRepository_1.articleRepository.getList({
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
    async getById(id) {
        return ArticleRepository_1.articleRepository.getByIdWithRelations(id);
    }
    async create(data) {
        const { deities, festivals, tags, bhajans, related_articles, ...articleData } = data;
        if (!articleData.slug && articleData.title) {
            articleData.slug = (0, slugify_1.slugify)(articleData.title);
        }
        const created = await ArticleRepository_1.articleRepository.create(articleData);
        await this.updateRelations(created.id, deities, festivals, tags, bhajans, related_articles);
        return created;
    }
    async update(id, data) {
        const { deities, festivals, tags, bhajans, related_articles, ...articleData } = data;
        const updated = await ArticleRepository_1.articleRepository.update(id, articleData);
        await this.updateRelations(id, deities, festivals, tags, bhajans, related_articles);
        return updated;
    }
    async updateRelations(id, deities, festivals, tags, bhajans, related_articles) {
        if (deities)
            await ArticleRepository_1.articleRepository.updateJunctionTable('article_gods', id, 'god_id', deities);
        if (festivals)
            await ArticleRepository_1.articleRepository.updateJunctionTable('article_festivals', id, 'festival_id', festivals);
        if (tags)
            await ArticleRepository_1.articleRepository.updateJunctionTable('article_tags', id, 'tag_id', tags);
        if (bhajans)
            await ArticleRepository_1.articleRepository.updateJunctionTable('article_bhajans', id, 'bhajan_id', bhajans);
        if (related_articles)
            await ArticleRepository_1.articleRepository.updateJunctionTable('related_articles', id, 'related_id', related_articles);
    }
    async delete(id) {
        return ArticleRepository_1.articleRepository.update(id, { deleted_at: new Date().toISOString() });
    }
    async bulkAction(ids, action) {
        return ArticleRepository_1.articleRepository.bulkAction(ids, action);
    }
}
exports.ArticleService = ArticleService;
exports.articleService = new ArticleService();
