"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.puranService = exports.PuranService = void 0;
const PuranRepository_1 = require("@repositories/PuranRepository");
const slugify_1 = require("@utils/slugify");
class PuranService {
    async getList(query) {
        return PuranRepository_1.puranRepository.getList({
            page: parseInt(query.page) || 1,
            limit: parseInt(query.limit) || 10,
            search: query.search,
            status: query.status,
            language: query.language,
            sort: query.sort
        });
    }
    async getById(id) {
        return PuranRepository_1.puranRepository.getById(id);
    }
    async create(data) {
        if (!data.slug && data.title) {
            data.slug = (0, slugify_1.slugify)(data.title);
        }
        return PuranRepository_1.puranRepository.create(data);
    }
    async update(id, data) {
        if (data.title && !data.slug) {
            data.slug = (0, slugify_1.slugify)(data.title);
        }
        return PuranRepository_1.puranRepository.update(id, data);
    }
    async delete(id) {
        return PuranRepository_1.puranRepository.update(id, { deleted_at: new Date().toISOString() });
    }
    async bulkAction(ids, action) {
        return PuranRepository_1.puranRepository.bulkAction(ids, action);
    }
    async getBySlug(slug) {
        const data = await PuranRepository_1.puranRepository.getBySlug(slug);
        if (!data)
            throw new Error('Purana not found');
        const related = await PuranRepository_1.puranRepository.getRelated(data.id, data.language || '');
        return { ...data, related };
    }
    async incrementView(id) {
        return PuranRepository_1.puranRepository.incrementStats(id, 'view_count');
    }
    async incrementDownload(id) {
        return PuranRepository_1.puranRepository.incrementStats(id, 'download_count');
    }
}
exports.PuranService = PuranService;
exports.puranService = new PuranService();
