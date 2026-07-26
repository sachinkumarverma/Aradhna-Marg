import { google } from 'googleapis';
import { config } from './config';
import { supabase } from './database/supabase';
import { youtubeSyncService } from './youtube/services/YoutubeSyncService';

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
    await supabase.from('settings').upsert({
      id: '00000000-0000-0000-0000-000000000001', // Example fixed ID for singleton
      site_name: 'Aradhna Marg',
      youtube_channel_id: channelId,
      is_singleton: true
    }, { onConflict: 'is_singleton' });
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
