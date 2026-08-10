"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminArticleController = void 0;
const apiResponse_1 = require("@/responses/apiResponse");
const ArticleService_1 = require("@services/ArticleService");
class AdminArticleController {
    list = async (req, res, next) => {
        try {
            const { data, count } = await ArticleService_1.articleService.getList(req.query);
            return (0, apiResponse_1.sendSuccess)(res, 'Articles fetched', data, { total: count, page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 10 });
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const data = await ArticleService_1.articleService.getById(req.params.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Article fetched', data);
        }
        catch (error) {
            next(error);
        }
    };
    create = async (req, res, next) => {
        try {
            const data = await ArticleService_1.articleService.create(req.body);
            return (0, apiResponse_1.sendSuccess)(res, 'Article created', data);
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            const data = await ArticleService_1.articleService.update(req.params.id, req.body);
            return (0, apiResponse_1.sendSuccess)(res, 'Article updated', data);
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            await ArticleService_1.articleService.delete(req.params.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Article deleted', null);
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
            await ArticleService_1.articleService.bulkAction(ids, action);
            return (0, apiResponse_1.sendSuccess)(res, `Successfully triggered ${action} on ${ids.length} items`, {});
        }
        catch (error) {
            next(error);
        }
    };
}
exports.adminArticleController = new AdminArticleController();
