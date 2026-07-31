import { google } from 'googleapis';
import { config } from './config';
import { db } from './common/database/DatabaseClient';
import { youtubeSyncService } from './features/youtube/YoutubeSyncService';

const handle = 'TheBhaktiMarg_Official';

async function run() {
  try {
    const youtube = google.youtube({
      version: 'v3',
      auth: config.YOUTUBE_API_KEY,
    });

    console.log(`Resolving handle: @${handle}`);
    
    // In Youtube Data API v3, resolving a handle requires searching for the channel or using forHandle
    // 'forHandle' is a relatively new parameter for channels.list
    const response = await youtube.channels.list({
      part: ['id'],
      forHandle: handle,
    });

    const channelId = response.data.items?.[0]?.id;
    if (!channelId) {
      console.error('Could not resolve channel handle to ID');
      return;
    }
    
    console.log(`Found Channel ID: ${channelId}`);
    
    // Save to settings
    await db.query(`
      INSERT INTO settings (id, site_name, youtube_channel_id, is_singleton)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        youtube_channel_id = EXCLUDED.youtube_channel_id,
        site_name = EXCLUDED.site_name
    `, ['00000000-0000-0000-0000-000000000001', 'Aradhna Marg', channelId, true]);
    console.log('Saved to settings table.');

    // Run sync service (we will limit it by passing a recent publishedAfter date to only get a few videos)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 24); // 2 years ago to get some videos
    
    console.log('Starting sync for videos published after:', lastMonth.toISOString());
    await youtubeSyncService.syncChannel(channelId, lastMonth.toISOString());
    
    console.log('Seed completed successfully!');
  } catch (err) {
    console.error('Seed Error:', err);
  }
}

run();
