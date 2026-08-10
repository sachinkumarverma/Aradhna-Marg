"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminFestivalController = void 0;
const apiResponse_1 = require("@/responses/apiResponse");
const FestivalService_1 = require("@services/FestivalService");
class AdminFestivalController {
    list = async (req, res, next) => {
        try {
            const { data, count } = await FestivalService_1.festivalService.getList(req.query);
            return (0, apiResponse_1.sendSuccess)(res, 'Festivals fetched', data, { total: count, page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 10 });
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const data = await FestivalService_1.festivalService.getById(req.params.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Festival fetched', data);
        }
        catch (error) {
            next(error);
        }
    };
    create = async (req, res, next) => {
        try {
            const data = await FestivalService_1.festivalService.create(req.body);
            return (0, apiResponse_1.sendSuccess)(res, 'Festival created', data);
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            const data = await FestivalService_1.festivalService.update(req.params.id, req.body);
            return (0, apiResponse_1.sendSuccess)(res, 'Festival updated', data);
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            await FestivalService_1.festivalService.delete(req.params.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Festival deleted', null);
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
            await FestivalService_1.festivalService.bulkAction(ids, action);
            return (0, apiResponse_1.sendSuccess)(res, `Successfully triggered ${action} on ${ids.length} items`, {});
        }
        catch (error) {
            next(error);
        }
    };
}
exports.adminFestivalController = new AdminFestivalController();
