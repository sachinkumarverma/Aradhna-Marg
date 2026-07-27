"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.puranPublicController = void 0;
const apiResponse_1 = require("../responses/apiResponse");
const PuranService_1 = require("../services/PuranService");
class PuranPublicController {
    getBySlug = async (req, res, next) => {
        try {
            const data = await PuranService_1.puranService.getBySlug(req.params.slug);
            return (0, apiResponse_1.sendSuccess)(res, 'Purana fetched successfully', data);
        }
        catch (error) {
            next(error);
        }
    };
    trackView = async (req, res, next) => {
        try {
            await PuranService_1.puranService.incrementView(req.params.id);
            return (0, apiResponse_1.sendSuccess)(res, 'View tracked', null);
        }
        catch (error) {
            next(error);
        }
    };
    trackDownload = async (req, res, next) => {
        try {
            await PuranService_1.puranService.incrementDownload(req.params.id);
            return (0, apiResponse_1.sendSuccess)(res, 'Download tracked', null);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.puranPublicController = new PuranPublicController();
