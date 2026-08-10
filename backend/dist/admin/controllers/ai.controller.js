"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAiController = void 0;
const apiResponse_1 = require("@/responses/apiResponse");
const AiJobService_1 = require("@admin/services/AiJobService");
class AdminAiController {
    service;
    constructor() {
        this.service = new AiJobService_1.AiJobService();
    }
    list = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const status = req.query.status;
            const result = await this.service.getJobs({ page, limit, status });
            (0, apiResponse_1.sendSuccess)(res, 'AI jobs retrieved successfully', result);
        }
        catch (error) {
            next(error);
        }
    };
    getStats = async (req, res, next) => {
        try {
            const stats = await this.service.getStats();
            (0, apiResponse_1.sendSuccess)(res, 'AI stats retrieved successfully', stats);
        }
        catch (error) {
            next(error);
        }
    };
    queueJob = async (req, res, next) => {
        try {
            const job = await this.service.queueJob(req.body);
            (0, apiResponse_1.sendSuccess)(res, 'AI job queued successfully', job, 201);
        }
        catch (error) {
            next(error);
        }
    };
    retryJob = async (req, res, next) => {
        try {
            const job = await this.service.retryJob(req.params.id);
            (0, apiResponse_1.sendSuccess)(res, 'AI job retry initiated', job);
        }
        catch (error) {
            next(error);
        }
    };
    cancelJob = async (req, res, next) => {
        try {
            const job = await this.service.cancelJob(req.params.id);
            (0, apiResponse_1.sendSuccess)(res, 'AI job cancelled', job);
        }
        catch (error) {
            next(error);
        }
    };
    deleteJob = async (req, res, next) => {
        try {
            await this.service.deleteJob(req.params.id);
            (0, apiResponse_1.sendSuccess)(res, 'AI job deleted successfully');
        }
        catch (error) {
            next(error);
        }
    };
}
exports.adminAiController = new AdminAiController();
