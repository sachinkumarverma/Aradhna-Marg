"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deityService = exports.DeityService = void 0;
const DeityRepository_1 = require("./DeityRepository");
class DeityService {
    async getDeities(options) {
        return DeityRepository_1.deityRepository.findAll(options);
    }
    async getDeity(id) {
        return DeityRepository_1.deityRepository.findById(id);
    }
    async createDeity(data, userId) {
        if (!data.slug) {
            data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }
        return DeityRepository_1.deityRepository.create({ ...data, createdBy: userId });
    }
    async updateDeity(id, data, userId) {
        if (data.name && !data.slug) {
            data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }
        return DeityRepository_1.deityRepository.update(id, { ...data, updatedBy: userId });
    }
    async deleteDeity(id) {
        return DeityRepository_1.deityRepository.delete(id);
    }
    async bulkDeleteDeities(ids) {
        for (const id of ids) {
            await DeityRepository_1.deityRepository.delete(id);
        }
    }
    async bulkEditDeities(ids, data, userId) {
        for (const id of ids) {
            await DeityRepository_1.deityRepository.update(id, { ...data, updatedBy: userId });
        }
    }
}
exports.DeityService = DeityService;
exports.deityService = new DeityService();
