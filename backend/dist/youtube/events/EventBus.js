"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = exports.EVENTS = void 0;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
// Event Names
exports.EVENTS = {
    VIDEO_IMPORTED: 'VIDEO_IMPORTED',
    VIDEO_UPDATED: 'VIDEO_UPDATED',
    VIDEO_DELETED: 'VIDEO_DELETED',
    SYNC_STARTED: 'SYNC_STARTED',
    SYNC_COMPLETED: 'SYNC_COMPLETED',
    SYNC_FAILED: 'SYNC_FAILED',
};
class EventBus extends events_1.EventEmitter {
    constructor() {
        super();
        // Increase limit for high-throughput syncs
        this.setMaxListeners(50);
    }
    publish(event, payload) {
        logger_1.logger.debug(`[EVENT PUBLISHED] ${event}`, payload.videoId ? { videoId: payload.videoId } : {});
        this.emit(event, payload);
    }
    subscribe(event, callback) {
        this.on(event, async (payload) => {
            try {
                await callback(payload);
            }
            catch (error) {
                logger_1.logger.error(`[EVENT HANDLER FAILED] Event: ${event}`, error);
            }
        });
    }
}
exports.eventBus = new EventBus();
