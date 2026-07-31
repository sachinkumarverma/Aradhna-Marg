"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const manager_1 = require("../../../cron/manager");
const YoutubeSyncService_1 = require("../../youtube/YoutubeSyncService");
const DatabaseClient_1 = require("../../../common/database/DatabaseClient");
const logger_1 = require("../../../utils/logger");
manager_1.cronManager.register({
    name: 'IncrementalYouTubeSync',
    description: 'Syncs new videos from YouTube every 6 hours',
    schedule: '0 */6 * * *', // Every 6 hours
    status: 'IDLE',
    run: async () => {
        try {
            // Get Channel ID from Settings
            let settings;
            try {
                const result = await DatabaseClient_1.db.query(`SELECT youtube_channel_id FROM settings LIMIT 1`);
                settings = result.rows[0];
            }
            catch (e) {
                // Ignore table not found
            }
            if (!settings?.youtube_channel_id) {
                logger_1.logger.warn('Cron skipped: No YouTube Channel ID configured in settings.');
                return;
            }
            // Get last sync date from logs
            let lastLog;
            try {
                const result = await DatabaseClient_1.db.query(`SELECT started_at FROM youtube_sync_logs WHERE status = 'COMPLETED' ORDER BY started_at DESC LIMIT 1`);
                lastLog = result.rows[0];
            }
            catch (e) {
                // Ignore table not found
            }
            const publishedAfter = lastLog?.started_at ? new Date(lastLog.started_at).toISOString() : undefined;
            await YoutubeSyncService_1.youtubeSyncService.syncChannel(settings.youtube_channel_id, publishedAfter);
        }
        catch (error) {
            logger_1.logger.error('Scheduled YouTube Sync Failed', error.message || error);
            throw error;
        }
    }
});
