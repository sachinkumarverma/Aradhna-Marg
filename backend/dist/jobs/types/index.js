"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformEvent = exports.JobPriority = exports.JobState = exports.JobType = void 0;
var JobType;
(function (JobType) {
    JobType["YOUTUBE_SYNC_INCREMENTAL"] = "YOUTUBE_SYNC_INCREMENTAL";
    JobType["YOUTUBE_SYNC_FULL"] = "YOUTUBE_SYNC_FULL";
    JobType["AI_PROCESSING"] = "AI_PROCESSING";
    JobType["SEO_GENERATION"] = "SEO_GENERATION";
    JobType["PDF_GENERATION"] = "PDF_GENERATION";
    JobType["SEARCH_INDEX"] = "SEARCH_INDEX";
    JobType["COLLECTION_REFRESH"] = "COLLECTION_REFRESH";
    JobType["CACHE_CLEANUP"] = "CACHE_CLEANUP";
    JobType["ANALYTICS_AGGREGATION"] = "ANALYTICS_AGGREGATION";
    JobType["HEALTH_CHECK"] = "HEALTH_CHECK";
    JobType["BACKUP"] = "BACKUP";
})(JobType || (exports.JobType = JobType = {}));
var JobState;
(function (JobState) {
    JobState["QUEUED"] = "QUEUED";
    JobState["RUNNING"] = "RUNNING";
    JobState["COMPLETED"] = "COMPLETED";
    JobState["FAILED"] = "FAILED";
    JobState["RETRYING"] = "RETRYING";
    JobState["CANCELLED"] = "CANCELLED";
    JobState["PAUSED"] = "PAUSED";
})(JobState || (exports.JobState = JobState = {}));
var JobPriority;
(function (JobPriority) {
    JobPriority[JobPriority["HIGH"] = 1] = "HIGH";
    JobPriority[JobPriority["MEDIUM"] = 2] = "MEDIUM";
    JobPriority[JobPriority["LOW"] = 3] = "LOW";
})(JobPriority || (exports.JobPriority = JobPriority = {}));
var PlatformEvent;
(function (PlatformEvent) {
    PlatformEvent["VIDEO_IMPORTED"] = "VIDEO_IMPORTED";
    PlatformEvent["AI_COMPLETED"] = "AI_COMPLETED";
    PlatformEvent["AI_FAILED"] = "AI_FAILED";
    PlatformEvent["SEO_GENERATED"] = "SEO_GENERATED";
    PlatformEvent["PDF_GENERATED"] = "PDF_GENERATED";
    PlatformEvent["PDF_FAILED"] = "PDF_FAILED";
    PlatformEvent["SEARCH_INDEXED"] = "SEARCH_INDEXED";
    PlatformEvent["COLLECTION_UPDATED"] = "COLLECTION_UPDATED";
    PlatformEvent["SYNC_COMPLETED"] = "SYNC_COMPLETED";
    PlatformEvent["SYNC_FAILED"] = "SYNC_FAILED";
})(PlatformEvent || (exports.PlatformEvent = PlatformEvent = {}));
