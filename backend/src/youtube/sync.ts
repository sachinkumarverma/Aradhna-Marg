import { youtubeSyncService } from './services/YoutubeSyncService';
import { configurationService } from '../services/ConfigurationService';

async function run() {
  console.log('Fetching configuration...');
  const config = await configurationService.getConfiguration();
  
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
    await youtubeSyncService.syncChannel(config.youtube.channelId);
    console.log('Sync completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

run();
