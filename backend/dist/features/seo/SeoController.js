"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seoController = exports.SeoController = void 0;
const SeoService_1 = require("./SeoService");
const apiResponse_1 = require("../../responses/apiResponse");
class SeoController {
    async getOverview(req, res, next) {
        try {
            const overview = await SeoService_1.seoService.getOverview();
            return (0, apiResponse_1.sendSuccess)(res, 'SEO Overview retrieved', overview);
        }
        catch (error) {
            next(error);
        }
    }
    async getIssues(req, res, next) {
        try {
            const issues = await SeoService_1.seoService.getIssues();
            return (0, apiResponse_1.sendSuccess)(res, 'SEO Issues retrieved', issues);
        }
        catch (error) {
            next(error);
        }
    }
    async generateSitemap(req, res, next) {
        try {
            await SeoService_1.seoService.generateSitemap();
            return (0, apiResponse_1.sendSuccess)(res, 'Sitemap generation triggered');
        }
        catch (error) {
            next(error);
        }
    }
    async generateRobots(req, res, next) {
        try {
            await SeoService_1.seoService.generateRobots();
            return (0, apiResponse_1.sendSuccess)(res, 'robots.txt generation triggered');
        }
        catch (error) {
            next(error);
        }
    }
    async generateBulkSEO(req, res, next) {
        try {
            await SeoService_1.seoService.generateBulkSEO(req.body);
            return (0, apiResponse_1.sendSuccess)(res, 'Bulk SEO generation started');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SeoController = SeoController;
exports.seoController = new SeoController();
