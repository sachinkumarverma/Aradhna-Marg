"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.youtubeController = void 0;
const YoutubeSyncService_1 = require("../services/YoutubeSyncService");
const apiResponse_1 = require("../../responses/apiResponse");
class YoutubeController {
    triggerSync = async (req, res, next) => {
        try {
            const { channelId, fullSync } = req.body;
            // Async trigger, do not await the entire sync in the HTTP cycle
            // In production, you would fetch last sync time if fullSync is false
            YoutubeSyncService_1.youtubeSyncService.syncChannel(channelId, fullSync ? undefined : new Date(Date.now() - 86400000).toISOString()).catch(next);
            return (0, apiResponse_1.sendSuccess)(res, 'YouTube synchronization started in the background.', { channelId, fullSync });
        }
        catch (error) {
            next(error);
        }
    };
    getStatus = async (req, res, next) => {
        try {
            // Fetch latest sync status from DB
            return (0, apiResponse_1.sendSuccess)(res, 'Status fetched', { status: 'IDLE', lastSync: new Date() });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.youtubeController = new YoutubeController();
