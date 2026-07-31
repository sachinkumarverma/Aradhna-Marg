"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDeityController = void 0;
const apiResponse_1 = require("../../responses/apiResponse");
const DeityService_1 = require("../services/DeityService");
class AdminDeityController {
    service;
    constructor() {
        this.service = new DeityService_1.DeityService();
    }
    list = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search;
            const { data, meta } = await this.service.getAllDeities(page, limit, search);
            return (0, apiResponse_1.sendSuccess)(res, 'Deities fetched', data, meta);
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const data = await this.service.getDeityById(req.params.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Deity fetched', data);
        }
        catch (error) {
            next(error);
        }
    };
    create = async (req, res, next) => {
        try {
            const userId = req.user?.id || 'system';
            const data = await this.service.createDeity(req.body, userId);
            return (0, apiResponse_1.sendSuccess)(res, 'Deity created', data);
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            const userId = req.user?.id || 'system';
            const data = await this.service.updateDeity(req.params.id, req.body, userId);
            return (0, apiResponse_1.sendSuccess)(res, 'Deity updated', data);
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            await this.service.deleteDeity(req.params.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Deity deleted', null);
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
            // We will implement bulk actions in the service if needed,
            // but for now we can just loop over them since this is an admin tool.
            for (const id of ids) {
                if (action === 'DELETE') {
                    await this.service.deleteDeity(id);
                }
                else if (action === 'ACTIVATE') {
                    await this.service.updateDeity(id, { status: 'ACTIVE' }, req.user?.id || 'system');
                }
                else if (action === 'DEACTIVATE') {
                    await this.service.updateDeity(id, { status: 'INACTIVE' }, req.user?.id || 'system');
                }
            }
            return (0, apiResponse_1.sendSuccess)(res, `Successfully triggered ${action} on ${ids.length} items`, {});
        }
        catch (error) {
            next(error);
        }
    };
}
exports.adminDeityController = new AdminDeityController();
