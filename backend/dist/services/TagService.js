"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagService = exports.TagService = void 0;
const TagRepository_1 = require("../repositories/TagRepository");
const appError_1 = require("../errors/appError");
class TagService {
    async getTags(options) {
        return TagRepository_1.tagRepository.findAll(options);
    }
    async getTag(id) {
        const tag = await TagRepository_1.tagRepository.findById(id);
        if (!tag)
            throw new appError_1.NotFoundError('Tag not found');
        return tag;
    }
    async createTag(data) {
        if (!data.slug) {
            data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }
        return TagRepository_1.tagRepository.create(data);
    }
    async updateTag(id, data) {
        await this.getTag(id); // Ensure exists
        if (data.name && !data.slug) {
            data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }
        return TagRepository_1.tagRepository.update(id, data);
    }
    async deleteTag(id) {
        await this.getTag(id); // Ensure exists
        return TagRepository_1.tagRepository.delete(id);
    }
    async bulkDeleteTags(ids) {
        for (const id of ids) {
            await TagRepository_1.tagRepository.delete(id);
        }
    }
    async bulkEditTags(ids, data) {
        for (const id of ids) {
            await TagRepository_1.tagRepository.update(id, data);
        }
    }
}
exports.TagService = TagService;
exports.tagService = new TagService();
