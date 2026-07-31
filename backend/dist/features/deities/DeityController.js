"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deityController = exports.DeityController = void 0;
const DeityService_1 = require("./DeityService");
const apiResponse_1 = require("../../responses/apiResponse");
class DeityController {
    async getDeities(req, res, next) {
        try {
            const { search, page, limit } = req.query;
            const result = await DeityService_1.deityService.getDeities({
                search: search,
                page: page ? parseInt(page, 10) : undefined,
                limit: limit ? parseInt(limit, 10) : undefined,
            });
            return (0, apiResponse_1.sendSuccess)(res, 'Deities fetched', result.data, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    async getDeity(req, res, next) {
        try {
            const data = await DeityService_1.deityService.getDeity(req.params.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Deity fetched', data);
        }
        catch (error) {
            next(error);
        }
    }
    async createDeity(req, res, next) {
        try {
            const data = await DeityService_1.deityService.createDeity(req.body, req.user?.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Deity created', data);
        }
        catch (error) {
            next(error);
        }
    }
    async updateDeity(req, res, next) {
        try {
            const data = await DeityService_1.deityService.updateDeity(req.params.id, req.body, req.user?.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Deity updated', data);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteDeity(req, res, next) {
        try {
            await DeityService_1.deityService.deleteDeity(req.params.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Deity deleted', null);
        }
        catch (error) {
            next(error);
        }
    }
    async bulkAction(req, res, next) {
        try {
            const { ids, action } = req.body;
            const userId = req.user?.id;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                throw new Error('Invalid IDs array');
            }
            if (action === 'DELETE') {
                await DeityService_1.deityService.bulkDeleteDeities(ids);
            }
            else if (action === 'ACTIVATE') {
                await DeityService_1.deityService.bulkEditDeities(ids, { status: 'ACTIVE' }, userId);
            }
            else if (action === 'DEACTIVATE') {
                await DeityService_1.deityService.bulkEditDeities(ids, { status: 'INACTIVE' }, userId);
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
exports.DeityController = DeityController;
exports.deityController = new DeityController();
