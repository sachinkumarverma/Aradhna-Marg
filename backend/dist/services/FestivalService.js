"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.festivalService = exports.FestivalService = void 0;
const FestivalRepository_1 = require("@repositories/FestivalRepository");
class FestivalService {
    async getList(query) {
        const { search, sort, order, page, limit } = query;
        const { data, total } = await FestivalRepository_1.festivalRepository.findAll({
            search: search,
            sort: sort,
            order: order,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
        });
        return { data, count: total };
    }
    async getById(id) {
        const festival = await FestivalRepository_1.festivalRepository.findById(id);
        if (!festival)
            throw new Error('Festival not found');
        return festival;
    }
    async create(data) {
        if (!data.slug) {
            data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }
        return FestivalRepository_1.festivalRepository.create(data);
    }
    async update(id, data) {
        if (data.name && !data.slug) {
            data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }
        return FestivalRepository_1.festivalRepository.update(id, data);
    }
    async delete(id) {
        await FestivalRepository_1.festivalRepository.delete(id);
    }
    async bulkAction(ids, action) {
        await FestivalRepository_1.festivalRepository.bulkAction(ids, action);
    }
}
exports.FestivalService = FestivalService;
exports.festivalService = new FestivalService();
