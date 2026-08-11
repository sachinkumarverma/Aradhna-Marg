"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagController = exports.TagController = void 0;
const TagService_1 = require("./TagService");
const apiResponse_1 = require("../../responses/apiResponse");
class TagController {
    async getTags(req, res, next) {
        try {
            const { search, sort, order, page, limit, status } = req.query;
            const result = await TagService_1.tagService.getTags({
                search: search,
                sort: sort,
                order: order,
                page: page ? parseInt(page, 10) : undefined,
                limit: limit ? parseInt(limit, 10) : undefined,
                status: status,
            });
            return (0, apiResponse_1.sendSuccess)(res, 'Tags retrieved successfully', result.data, { total: result.total });
        }
        catch (error) {
            next(error);
        }
    }
    async getTag(req, res, next) {
        try {
            const tag = await TagService_1.tagService.getTag(req.params.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Tag retrieved', tag);
        }
        catch (error) {
            next(error);
        }
    }
    async createTag(req, res, next) {
        try {
            const tag = await TagService_1.tagService.createTag(req.body);
            return (0, apiResponse_1.sendSuccess)(res, 'Tag created successfully', tag, undefined, 201);
        }
        catch (error) {
            next(error);
        }
    }
    async updateTag(req, res, next) {
        try {
            const tag = await TagService_1.tagService.updateTag(req.params.id, req.body);
            return (0, apiResponse_1.sendSuccess)(res, 'Tag updated successfully', tag);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteTag(req, res, next) {
        try {
            await TagService_1.tagService.deleteTag(req.params.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Tag deleted successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async bulkAction(req, res, next) {
        try {
            const { ids, action } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                throw new Error('Invalid IDs array');
            }
            if (action === 'DELETE') {
                await TagService_1.tagService.bulkDeleteTags(ids);
            }
            else if (action === 'ACTIVATE') {
                await TagService_1.tagService.bulkEditTags(ids, { status: 'ACTIVE' });
            }
            else if (action === 'DEACTIVATE') {
                await TagService_1.tagService.bulkEditTags(ids, { status: 'INACTIVE' });
            }
            else {
                throw new Error('Invalid bulk action');
            }
            return (0, apiResponse_1.sendSuccess)(res, `Successfully triggered ${action} on ${ids.length} items`, {});
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TagController = TagController;
exports.tagController = new TagController();
