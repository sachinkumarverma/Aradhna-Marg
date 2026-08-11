"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryCache = void 0;
const logger_1 = require("../../utils/logger");
class MemoryCache {
    store = new Map();
    async get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        if (entry.expiry && Date.now() > entry.expiry) {
            this.store.delete(key);
            return null;
        }
        return entry.value;
    }
    async set(key, value, ttlSeconds) {
        const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
        this.store.set(key, { value, expiry });
    }
    async delete(key) {
        this.store.delete(key);
    }
    async clearPattern(pattern) {
        const regex = new RegExp(`^${pattern.replace('*', '.*')}$`);
        let deleted = 0;
        for (const key of this.store.keys()) {
            if (regex.test(key)) {
                this.store.delete(key);
                deleted++;
            }
        }
        logger_1.logger.debug(`[Cache] Cleared ${deleted} keys matching pattern ${pattern}`);
    }
    async flush() {
        this.store.clear();
        logger_1.logger.info(`[Cache] Flushed entirely`);
    }
}
exports.MemoryCache = MemoryCache;
