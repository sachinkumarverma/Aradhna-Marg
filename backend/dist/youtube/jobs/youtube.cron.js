"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const manager_1 = require("../../cron/manager");
const YoutubeSyncService_1 = require("../services/YoutubeSyncService");
const supabase_1 = require("../../database/supabase");
const logger_1 = require("../../utils/logger");
manager_1.cronManager.register({
    name: 'IncrementalYouTubeSync',
    description: 'Syncs new videos from YouTube every 6 hours',
    schedule: '0 */6 * * *', // Every 6 hours
    status: 'IDLE',
    run: async () => {
        try {
            // Get Channel ID from Settings
            const { data: settings } = await supabase_1.supabase.from('settings').select('youtube_channel_id').single();
            if (!settings?.youtube_channel_id) {
                logger_1.logger.warn('Cron skipped: No YouTube Channel ID configured in settings.');
                return;
            }
            // Get last sync date from logs
            const { data: lastLog } = await supabase_1.supabase
                .from('youtube_sync_logs')
                .select('started_at')
                .eq('status', 'COMPLETED')
                .order('started_at', { ascending: false })
                .limit(1)
                .single();
            const publishedAfter = lastLog?.started_at ? new Date(lastLog.started_at).toISOString() : undefined;
            await YoutubeSyncService_1.youtubeSyncService.syncChannel(settings.youtube_channel_id, publishedAfter);
        }
        catch (error) {
            logger_1.logger.error('Scheduled YouTube Sync Failed', error);
            throw error;
        }
    }
});
