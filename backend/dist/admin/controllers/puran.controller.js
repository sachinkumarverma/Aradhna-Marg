"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPuranController = void 0;
const apiResponse_1 = require("@/responses/apiResponse");
const PuranService_1 = require("@services/PuranService");
class AdminPuranController {
    list = async (req, res, next) => {
        try {
            const { data, count } = await PuranService_1.puranService.getList(req.query);
            return (0, apiResponse_1.sendSuccess)(res, 'Puranas fetched', data, { total: count, page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 10 });
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const data = await PuranService_1.puranService.getById(req.params.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Purana fetched', data);
        }
        catch (error) {
            next(error);
        }
    };
    create = async (req, res, next) => {
        try {
            const data = await PuranService_1.puranService.create(req.body);
            return (0, apiResponse_1.sendSuccess)(res, 'Purana created', data);
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            const data = await PuranService_1.puranService.update(req.params.id, req.body);
            return (0, apiResponse_1.sendSuccess)(res, 'Purana updated', data);
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            await PuranService_1.puranService.delete(req.params.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Purana deleted', null);
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
            await PuranService_1.puranService.bulkAction(ids, action);
            return (0, apiResponse_1.sendSuccess)(res, `Successfully triggered ${action} on ${ids.length} items`, {});
        }
        catch (error) {
            next(error);
        }
    };
}
exports.adminPuranController = new AdminPuranController();
