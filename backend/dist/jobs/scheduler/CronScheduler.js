"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const types_1 = require("../types");
const logger_1 = require("../../utils/logger");
class CronScheduler {
    queue;
    tasks = [];
    constructor(queue) {
        this.queue = queue;
    }
    start() {
        logger_1.logger.info('[Scheduler] Starting cron jobs...');
        // Every 6 Hours: Incremental YouTube Sync
        this.schedule('0 */6 * * *', types_1.JobType.YOUTUBE_SYNC_INCREMENTAL, {}, types_1.JobPriority.MEDIUM);
        // Daily at Midnight: Search Index Refresh & Analytics Aggregation
        this.schedule('0 0 * * *', types_1.JobType.SEARCH_INDEX, {}, types_1.JobPriority.LOW);
        this.schedule('0 0 * * *', types_1.JobType.ANALYTICS_AGGREGATION, {}, types_1.JobPriority.LOW);
        this.schedule('0 0 * * *', types_1.JobType.COLLECTION_REFRESH, {}, types_1.JobPriority.LOW);
        // Weekly (Sunday Midnight): Cache Cleanup & Full Validation
        this.schedule('0 0 * * 0', types_1.JobType.CACHE_CLEANUP, {}, types_1.JobPriority.LOW);
        // Monthly (1st of Month): DB Backup
        this.schedule('0 0 1 * *', types_1.JobType.BACKUP, {}, types_1.JobPriority.LOW);
    }
    stop() {
        this.tasks.forEach(task => task.stop());
        this.tasks = [];
        logger_1.logger.info('[Scheduler] Stopped all cron jobs');
    }
    schedule(cronExpression, jobType, payload, priority) {
        const task = node_cron_1.default.schedule(cronExpression, async () => {
            logger_1.logger.info(`[Scheduler] Triggering scheduled job: ${jobType}`);
            try {
                await this.queue.enqueue(jobType, payload, priority);
            }
            catch (error) {
                logger_1.logger.error(`[Scheduler] Failed to enqueue scheduled job: ${jobType}`, error);
            }
        });
        this.tasks.push(task);
    }
}
exports.CronScheduler = CronScheduler;
