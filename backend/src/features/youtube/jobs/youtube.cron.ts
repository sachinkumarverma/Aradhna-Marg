import { cronManager } from '@/cron/manager';
import { youtubeSyncService } from '@features/youtube/YoutubeSyncService';
import { db } from '@common/database/DatabaseClient';
import { logger } from '@utils/logger';

cronManager.register({
  name: 'IncrementalYouTubeSync',
  description: 'Syncs new videos from YouTube every 6 hours',
  schedule: '0 */6 * * *', // Every 6 hours
  status: 'IDLE',
  run: async () => {
    try {
      let settings;
      try {
        const result = await db.query(`
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
      } catch (e) {
        // Ignore table not found
      }
      
      if (!settings?.youtube_channel_id) {
        logger.warn('Cron skipped: No YouTube Channel ID configured in settings.');
        return;
      }

      if (settings.youtube_auto_sync === false) {
        logger.info('Cron skipped: Auto-sync is disabled in settings.');
        return;
      }

      // Check if enough time has passed based on the dynamic interval (in hours)
      const intervalHours = parseInt(settings.youtube_sync_interval) || 6; // Default 6 hours
      const lastSync = settings.youtube_last_sync ? new Date(settings.youtube_last_sync).getTime() : 0;
      const now = Date.now();
      const elapsedHours = (now - lastSync) / (1000 * 60 * 60);

      if (elapsedHours < intervalHours) {
        logger.info(`Cron skipped: Only ${elapsedHours.toFixed(1)}h elapsed out of ${intervalHours}h interval.`);
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

      logger.info(`Starting dynamic YouTube sync for channel ${settings.youtube_channel_id}`);
      await youtubeSyncService.syncChannel(settings.youtube_channel_id, publishedAfter);

      // Update last sync time in settings
      if (settings.id) {
        await db.query(`UPDATE settings SET youtube_last_sync = NOW() WHERE id = $1`, [settings.id]);
        logger.info('Updated youtube_last_sync in settings.');
      }
    } catch (error: any) {
      logger.error('Scheduled YouTube Sync Failed', error.message || error);
      throw error;
    }
  }
});
