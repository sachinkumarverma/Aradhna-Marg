import { cronManager } from '../../cron/manager';
import { youtubeSyncService } from '../services/YoutubeSyncService';
import { supabase } from '../../database/supabase';
import { logger } from '../../utils/logger';

cronManager.register({
  name: 'IncrementalYouTubeSync',
  description: 'Syncs new videos from YouTube every 6 hours',
  schedule: '0 */6 * * *', // Every 6 hours
  status: 'IDLE',
  run: async () => {
    try {
      // Get Channel ID from Settings
      const { data: settings } = await supabase.from('settings').select('youtube_channel_id').single();
      
      if (!settings?.youtube_channel_id) {
        logger.warn('Cron skipped: No YouTube Channel ID configured in settings.');
        return;
      }

      // Get last sync date from logs
      const { data: lastLog } = await supabase
        .from('youtube_sync_logs')
        .select('started_at')
        .eq('status', 'COMPLETED')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      const publishedAfter = lastLog?.started_at ? new Date(lastLog.started_at).toISOString() : undefined;

      await youtubeSyncService.syncChannel(settings.youtube_channel_id, publishedAfter);
    } catch (error) {
      logger.error('Scheduled YouTube Sync Failed', error);
      throw error;
    }
  }
});
