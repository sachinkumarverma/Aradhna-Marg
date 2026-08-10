"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YouTubeWorker = void 0;
const BaseWorker_1 = require("./BaseWorker");
const types_1 = require("@/jobs/types");
const EventBus_1 = require("@/jobs/events/EventBus");
const logger_1 = require("@utils/logger");
class YouTubeWorker extends BaseWorker_1.BaseWorker {
    constructor(queue) {
        super(queue, types_1.JobType.YOUTUBE_SYNC_INCREMENTAL, 10000); // poll every 10s
    }
    async process(job) {
        logger_1.logger.info(`[YouTubeWorker] Starting incremental sync...`);
        // 1. Fetch channel metadata (mocked)
        const newVideos = [
            { videoId: 'abc123_', title: 'New Shiv Bhajan' },
            { videoId: 'xyz987_', title: 'Aarti Collection' }
        ];
        if (newVideos.length === 0) {
            logger_1.logger.info(`[YouTubeWorker] No new videos found.`);
            return;
        }
        // 2. Insert minimal records into Database (mocked)
        for (const video of newVideos) {
            logger_1.logger.info(`[YouTubeWorker] Imported video ${video.videoId}`);
            // 3. ✨ ARCHITECTURE KEY: Publish Event rather than calling AI queue directly ✨
            EventBus_1.eventBus.publish(types_1.PlatformEvent.VIDEO_IMPORTED, {
                videoId: video.videoId,
                title: video.title,
                jobId: job.id
            });
        }
        EventBus_1.eventBus.publish(types_1.PlatformEvent.SYNC_COMPLETED, { count: newVideos.length });
    }
}
exports.YouTubeWorker = YouTubeWorker;
