import { cronManager } from '../../../cron/manager';
import { youtubeSyncService } from '../YoutubeSyncService';
import { db } from '../../../common/database/DatabaseClient';
import { logger } from '../../../utils/logger';

cronManager.register({
  name: 'IncrementalYouTubeSync',
  description: 'Syncs new videos from YouTube every 6 hours',
  schedule: '0 */6 * * *', // Every 6 hours
  status: 'IDLE',
  run: async () => {
    try {
      // Get Channel ID from Settings
      let settings;
      try {
        const result = await db.query(`SELECT youtube_channel_id FROM settings LIMIT 1`);
        settings = result.rows[0];
      } catch (e) {
        // Ignore table not found
      }
      
      if (!settings?.youtube_channel_id) {
        logger.warn('Cron skipped: No YouTube Channel ID configured in settings.');
        return;
      }

      // Get last sync date from logs
      let lastLog;
      try {
        const result = await db.query(`SELECT started_at FROM youtube_sync_logs WHERE status = 'COMPLETED' ORDER BY started_at DESC LIMIT 1`);
        lastLog = result.rows[0];
      } catch (e) {
        // Ignore table not found
      }

      const publishedAfter = lastLog?.started_at ? new Date(lastLog.started_at).toISOString() : undefined;

      await youtubeSyncService.syncChannel(settings.youtube_channel_id, publishedAfter);
    } catch (error: any) {
      logger.error('Scheduled YouTube Sync Failed', error.message || error);
      throw error;
    }
  }
});
