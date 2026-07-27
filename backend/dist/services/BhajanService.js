"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bhajanService = exports.BhajanService = void 0;
const BhajanRepository_1 = require("../repositories/BhajanRepository");
const slugify_1 = require("../utils/slugify");
class BhajanService {
    async getList(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        return BhajanRepository_1.bhajanRepository.getList({
            page,
            limit,
            search: query.search,
            status: query.status,
            category: query.category,
            primaryDeity: query.primaryDeity,
            sort: query.sort
        });
    }
    async getById(id) {
        return BhajanRepository_1.bhajanRepository.getByIdWithRelations(id);
    }
    async create(data) {
        const { additionalDeities, ...bhajanData } = data;
        if (!bhajanData.slug && bhajanData.title) {
            bhajanData.slug = (0, slugify_1.slugify)(bhajanData.title);
        }
        const created = await BhajanRepository_1.bhajanRepository.create(bhajanData);
        if (additionalDeities && Array.isArray(additionalDeities)) {
            await BhajanRepository_1.bhajanRepository.updateAdditionalDeities(created.id, additionalDeities);
        }
        return created;
    }
    async update(id, data) {
        const { additionalDeities, ...bhajanData } = data;
        const updated = await BhajanRepository_1.bhajanRepository.update(id, bhajanData);
        if (additionalDeities && Array.isArray(additionalDeities)) {
            await BhajanRepository_1.bhajanRepository.updateAdditionalDeities(id, additionalDeities);
        }
        return updated;
    }
    async delete(id) {
        return BhajanRepository_1.bhajanRepository.softDelete(id);
    }
    async bulkAction(ids, action) {
        return BhajanRepository_1.bhajanRepository.bulkAction(ids, action);
    }
}
exports.BhajanService = BhajanService;
exports.bhajanService = new BhajanService();
