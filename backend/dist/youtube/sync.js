"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const YoutubeSyncService_1 = require("./services/YoutubeSyncService");
const ConfigurationService_1 = require("../services/ConfigurationService");
async function run() {
    console.log('Fetching configuration...');
    const config = await ConfigurationService_1.configurationService.getConfiguration();
    if (!config.youtube.channelId) {
        console.error('No YouTube Channel ID configured in settings.');
        process.exit(1);
    }
    if (!config.youtube.apiKey) {
        console.error('No YouTube API Key found in environment variables.');
        process.exit(1);
    }
    console.log(`Starting sync for channel: ${config.youtube.channelId}`);
    try {
        await YoutubeSyncService_1.youtubeSyncService.syncChannel(config.youtube.channelId);
        console.log('Sync completed successfully.');
        process.exit(0);
    }
    catch (error) {
        console.error('Sync failed:', error);
        process.exit(1);
    }
}
run();
