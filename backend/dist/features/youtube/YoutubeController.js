"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.youtubeController = exports.YoutubeController = void 0;
const apiResponse_1 = require("@/responses/apiResponse");
const YoutubeService_1 = require("./YoutubeService");
class YoutubeController {
    async getVideos(req, res, next) {
        try {
            const search = req.query.search;
            const status = req.query.status;
            const type = req.query.type;
            const sortBy = req.query.sortBy || 'published_at';
            const sortOrder = req.query.sortOrder || 'desc';
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const { data, total } = await YoutubeService_1.youtubeService.getVideos(search, status, type, sortBy, sortOrder, page, limit);
            return (0, apiResponse_1.sendSuccess)(res, 'Videos retrieved', data, { total, page, limit });
        }
        catch (error) {
            next(error);
        }
    }
    async getStats(req, res, next) {
        try {
            const stats = await YoutubeService_1.youtubeService.getStats();
            return (0, apiResponse_1.sendSuccess)(res, 'Stats retrieved', stats);
        }
        catch (error) {
            next(error);
        }
    }
    async getSyncHistory(req, res, next) {
        try {
            const history = await YoutubeService_1.youtubeService.getSyncHistory();
            return (0, apiResponse_1.sendSuccess)(res, 'History retrieved', history);
        }
        catch (error) {
            next(error);
        }
    }
    async syncNow(req, res, next) {
        try {
            const result = await YoutubeService_1.youtubeService.syncNow();
            return (0, apiResponse_1.sendSuccess)(res, 'Sync triggered successfully', result);
        }
        catch (error) {
            next(error);
        }
    }
    async linkBhajan(req, res, next) {
        try {
            const { id } = req.params;
            const { bhajanId } = req.body;
            const result = await YoutubeService_1.youtubeService.linkBhajan(id, bhajanId || null);
            return (0, apiResponse_1.sendSuccess)(res, 'Bhajan linked successfully', result);
        }
        catch (error) {
            next(error);
        }
    }
    async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const result = await YoutubeService_1.youtubeService.updateStatus(id, status);
            return (0, apiResponse_1.sendSuccess)(res, 'Status updated successfully', result);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteVideo(req, res, next) {
        try {
            const { id } = req.params;
            const result = await YoutubeService_1.youtubeService.deleteVideo(id);
            return (0, apiResponse_1.sendSuccess)(res, 'Video deleted', result);
        }
        catch (error) {
            next(error);
        }
    }
    async getBhajansForLink(req, res, next) {
        try {
            const result = await YoutubeService_1.youtubeService.getBhajansForLink();
            return (0, apiResponse_1.sendSuccess)(res, 'Bhajans fetched', result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.YoutubeController = YoutubeController;
exports.youtubeController = new YoutubeController();
