import { EventEmitter } from 'events';
import { PlatformEvent } from '../types';
import { logger } from '../../utils/logger';

type EventHandler = (payload: any) => Promise<void>;

class EventBus {
  private emitter = new EventEmitter();

  constructor() {
    // Increase limit for highly decoupled systems
    this.emitter.setMaxListeners(20);
  }

  public publish(event: PlatformEvent, payload: any): void {
    logger.debug(`[EventBus] Publishing ${event}`);
    this.emitter.emit(event, payload);
  }

  public subscribe(event: PlatformEvent, handler: EventHandler): void {
    logger.debug(`[EventBus] Subscribed to ${event}`);
    
    // Wrap handler in try/catch so a failing subscriber doesn't crash the Node process
    this.emitter.on(event, async (payload) => {
      try {
        await handler(payload);
      } catch (error) {
        logger.error(`[EventBus] Error in handler for ${event}`, error);
      }
    });
  }

  public unsubscribe(event: PlatformEvent, handler: EventHandler): void {
    this.emitter.off(event, handler);
  }
}

// Export singleton
export const eventBus = new EventBus();
