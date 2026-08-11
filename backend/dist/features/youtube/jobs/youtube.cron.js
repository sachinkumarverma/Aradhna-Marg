"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const manager_1 = require("../../../cron/manager");
const YoutubeService_1 = require("../../youtube/YoutubeService");
const DatabaseClient_1 = require("../../../common/database/DatabaseClient");
const logger_1 = require("../../../utils/logger");
manager_1.cronManager.register({
    name: 'IncrementalYouTubeSync',
    description: 'Syncs new videos from YouTube every 6 hours',
    schedule: '0 */6 * * *', // Every 6 hours
    status: 'IDLE',
    run: async () => {
        try {
            let settings;
            try {
                const result = await DatabaseClient_1.db.query(`
          SELECT 
            id,
            youtube_channel_id, 
            youtube_auto_sync, 
            youtube_sync_interval, 
            youtube_last_sync 
          FROM settings 
          LIMIT 1
        `);
                settings = result.rows[0];
            }
            catch (e) {
                // Ignore table not found
            }
            if (!settings?.youtube_channel_id) {
                logger_1.logger.warn('Cron skipped: No YouTube Channel ID configured in settings.');
                return;
            }
            if (settings.youtube_auto_sync === false) {
                logger_1.logger.info('Cron skipped: Auto-sync is disabled in settings.');
                return;
            }
            // Check if enough time has passed based on the dynamic interval (in hours)
            const intervalHours = parseInt(settings.youtube_sync_interval) || 6; // Default 6 hours
            const lastSync = settings.youtube_last_sync ? new Date(settings.youtube_last_sync).getTime() : 0;
            const now = Date.now();
            const elapsedHours = (now - lastSync) / (1000 * 60 * 60);
            if (elapsedHours < intervalHours) {
                logger_1.logger.info(`Cron skipped: Only ${elapsedHours.toFixed(1)}h elapsed out of ${intervalHours}h interval.`);
                return;
            }
            logger_1.logger.info(`Starting dynamic YouTube sync for channel ${settings.youtube_channel_id}`);
            await YoutubeService_1.youtubeService.syncNow();
        }
        catch (error) {
            logger_1.logger.error('Scheduled YouTube Sync Failed', error.message || error);
            throw error;
        }
    }
});
