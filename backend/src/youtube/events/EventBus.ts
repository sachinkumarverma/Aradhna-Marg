import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';

// Event Names
export const EVENTS = {
  VIDEO_IMPORTED: 'VIDEO_IMPORTED',
  VIDEO_UPDATED: 'VIDEO_UPDATED',
  VIDEO_DELETED: 'VIDEO_DELETED',
  SYNC_STARTED: 'SYNC_STARTED',
  SYNC_COMPLETED: 'SYNC_COMPLETED',
  SYNC_FAILED: 'SYNC_FAILED',
};

class EventBus extends EventEmitter {
  constructor() {
    super();
    // Increase limit for high-throughput syncs
    this.setMaxListeners(50);
  }

  public publish(event: string, payload: any) {
    logger.debug(`[EVENT PUBLISHED] ${event}`, payload.videoId ? { videoId: payload.videoId } : {});
    this.emit(event, payload);
  }

  public subscribe(event: string, callback: (payload: any) => void) {
    this.on(event, async (payload) => {
      try {
        await callback(payload);
      } catch (error) {
        logger.error(`[EVENT HANDLER FAILED] Event: ${event}`, error);
      }
    });
  }
}

export const eventBus = new EventBus();
