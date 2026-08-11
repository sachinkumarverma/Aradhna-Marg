"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuthorController = void 0;
const apiResponse_1 = require("../../responses/apiResponse");
const AuthorService_1 = require("../../services/AuthorService");
class AdminAuthorController {
    list = async (req, res, next) => {
        try {
            const { data, total } = await AuthorService_1.authorService.getAuthors(req.query);
            return (0, apiResponse_1.sendSuccess)(res, 'Authors fetched', data, { total, page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 10 });
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const data = await AuthorService_1.authorService.getAuthor(req.params.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Author fetched', data);
        }
        catch (error) {
            next(error);
        }
    };
    create = async (req, res, next) => {
        try {
            const data = await AuthorService_1.authorService.createAuthor(req.body);
            return (0, apiResponse_1.sendSuccess)(res, 'Author created', data);
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            const data = await AuthorService_1.authorService.updateAuthor(req.params.id, req.body);
            return (0, apiResponse_1.sendSuccess)(res, 'Author updated', data);
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            await AuthorService_1.authorService.deleteAuthor(req.params.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Author deleted', null);
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
                await AuthorService_1.authorService.bulkDeleteAuthors(ids);
            }
            else if (action === 'ACTIVATE') {
                await AuthorService_1.authorService.bulkEditAuthors(ids, { status: 'ACTIVE' });
            }
            else if (action === 'DEACTIVATE') {
                await AuthorService_1.authorService.bulkEditAuthors(ids, { status: 'INACTIVE' });
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
exports.adminAuthorController = new AdminAuthorController();
