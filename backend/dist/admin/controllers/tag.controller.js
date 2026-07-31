"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminTagController = void 0;
const apiResponse_1 = require("../../responses/apiResponse");
const TagService_1 = require("../../services/TagService");
class AdminTagController {
    list = async (req, res, next) => {
        try {
            const { data, total } = await TagService_1.tagService.getTags(req.query);
            return (0, apiResponse_1.sendSuccess)(res, 'Tags fetched', data, { total, page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 10 });
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const data = await TagService_1.tagService.getTag(req.params.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Tag fetched', data);
        }
        catch (error) {
            next(error);
        }
    };
    create = async (req, res, next) => {
        try {
            const data = await TagService_1.tagService.createTag(req.body);
            return (0, apiResponse_1.sendSuccess)(res, 'Tag created', data);
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            const data = await TagService_1.tagService.updateTag(req.params.id, req.body);
            return (0, apiResponse_1.sendSuccess)(res, 'Tag updated', data);
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            await TagService_1.tagService.deleteTag(req.params.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Tag deleted', null);
        }
        catch (error) {
            next(error);
        }
    };
    bulkAction = async (req, res, next) => {
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
    };
}
exports.adminTagController = new AdminTagController();
