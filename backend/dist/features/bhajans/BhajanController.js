"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminBhajanController = void 0;
const apiResponse_1 = require("../../responses/apiResponse");
const BhajanService_1 = require("./BhajanService");
class AdminBhajanController {
    list = async (req, res, next) => {
        try {
            const { data, count } = await BhajanService_1.bhajanService.getList(req.query);
            return (0, apiResponse_1.sendSuccess)(res, 'Bhajans fetched', data, { total: count, page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 10 });
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const data = await BhajanService_1.bhajanService.getById(req.params.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Bhajan fetched', data);
        }
        catch (error) {
            next(error);
        }
    };
    create = async (req, res, next) => {
        try {
            const data = await BhajanService_1.bhajanService.create(req.body);
            return (0, apiResponse_1.sendSuccess)(res, 'Bhajan created', data);
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            const data = await BhajanService_1.bhajanService.update(req.params.id, req.body);
            return (0, apiResponse_1.sendSuccess)(res, 'Bhajan updated', data);
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            await BhajanService_1.bhajanService.delete(req.params.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Bhajan deleted', null);
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
            await BhajanService_1.bhajanService.bulkAction(ids, action);
            return (0, apiResponse_1.sendSuccess)(res, `Successfully triggered ${action} on ${ids.length} items`, {});
        }
        catch (error) {
            next(error);
        }
    };
}
exports.adminBhajanController = new AdminBhajanController();
