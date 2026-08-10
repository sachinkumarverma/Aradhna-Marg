"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = void 0;
const events_1 = require("events");
const logger_1 = require("@utils/logger");
class EventBus {
    emitter = new events_1.EventEmitter();
    constructor() {
        // Increase limit for highly decoupled systems
        this.emitter.setMaxListeners(20);
    }
    publish(event, payload) {
        logger_1.logger.debug(`[EventBus] Publishing ${event}`);
        this.emitter.emit(event, payload);
    }
    subscribe(event, handler) {
        logger_1.logger.debug(`[EventBus] Subscribed to ${event}`);
        // Wrap handler in try/catch so a failing subscriber doesn't crash the Node process
        this.emitter.on(event, async (payload) => {
            try {
                await handler(payload);
            }
            catch (error) {
                logger_1.logger.error({ error }, `[EventBus] Error in handler for ${event}`);
            }
        });
    }
    unsubscribe(event, handler) {
        this.emitter.off(event, handler);
    }
}
// Export singleton
exports.eventBus = new EventBus();
