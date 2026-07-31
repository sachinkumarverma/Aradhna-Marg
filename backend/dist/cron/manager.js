"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronManager = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const logger_1 = require("../utils/logger");
class CronManager {
    jobs = new Map();
    tasks = new Map();
    register(job) {
        if (this.jobs.has(job.name)) {
            logger_1.logger.warn(`Cron job ${job.name} is already registered.`);
            return;
        }
        this.jobs.set(job.name, job);
        const task = node_cron_1.default.schedule(job.schedule, async () => {
            const currentJob = this.jobs.get(job.name);
            if (!currentJob || currentJob.status === 'RUNNING')
                return;
            currentJob.status = 'RUNNING';
            currentJob.lastRun = new Date();
            logger_1.logger.info(`Starting cron job: ${job.name}`);
            try {
                await currentJob.run();
                currentJob.status = 'IDLE';
                logger_1.logger.info(`Successfully completed cron job: ${job.name}`);
            }
            catch (error) {
                currentJob.status = 'FAILED';
                logger_1.logger.error({ error }, `Cron job ${job.name} failed`);
            }
        }, { name: job.name }); // node-cron v3 uses 'name' not 'scheduled'
        this.tasks.set(job.name, task);
        logger_1.logger.info(`Registered cron job: ${job.name} with schedule: ${job.schedule}`);
    }
    startAll() {
        this.tasks.forEach(task => task.start());
        logger_1.logger.info('All cron jobs started.');
    }
    stopAll() {
        this.tasks.forEach(task => task.stop());
        logger_1.logger.info('All cron jobs stopped.');
    }
}
exports.cronManager = new CronManager();
