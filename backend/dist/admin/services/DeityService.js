"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeityService = void 0;
const DeityRepository_1 = require("../repositories/DeityRepository");
class DeityService {
    repository;
    constructor() {
        this.repository = new DeityRepository_1.DeityRepository();
    }
    generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    }
    async getAllDeities(page, limit, search) {
        return this.repository.findAll(page, limit, search);
    }
    async getDeityById(id) {
        return this.repository.findById(id);
    }
    async createDeity(data, userId) {
        if (!data.slug) {
            data.slug = this.generateSlug(data.name);
        }
        // Check slug uniqueness
        const existing = await this.repository.findBySlug(data.slug);
        if (existing) {
            data.slug = `${data.slug}-${Math.floor(Math.random() * 1000)}`;
        }
        return this.repository.create({
            ...data,
            createdBy: userId,
            status: data.status || 'ACTIVE',
            featured: data.featured || false
        });
    }
    async updateDeity(id, data, userId) {
        if (data.name && !data.slug) {
            data.slug = this.generateSlug(data.name);
        }
        if (data.slug) {
            const existing = await this.repository.findBySlug(data.slug);
            if (existing && existing.id !== id) {
                data.slug = `${data.slug}-${Math.floor(Math.random() * 1000)}`;
            }
        }
        return this.repository.update(id, {
            ...data,
            updatedBy: userId
        });
    }
    async deleteDeity(id) {
        return this.repository.delete(id);
    }
}
exports.DeityService = DeityService;
