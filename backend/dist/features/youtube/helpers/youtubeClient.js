"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.youtubeClient = void 0;
const googleapis_1 = require("googleapis");
const config_1 = require("../../../config");
const appError_1 = require("../../../errors/appError");
const logger_1 = require("../../../utils/logger");
class YoutubeClient {
    youtube;
    constructor() {
        this.youtube = googleapis_1.google.youtube({
            version: 'v3',
            auth: config_1.config.YOUTUBE_API_KEY,
        });
    }
    /**
     * Fetch all videos for a specific channel using pagination
     * (Optionally filtered by publishedAfter for incremental sync)
     */
    async getVideos(channelId, publishedAfter) {
        try {
            let allVideos = [];
            let nextPageToken = undefined;
            // First, get the Uploads playlist ID for the channel
            const channelRes = await this.youtube.channels.list({
                part: ['contentDetails'],
                id: [channelId],
            });
            const uploadsPlaylistId = channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
            if (!uploadsPlaylistId) {
                throw new appError_1.InternalServerError('Uploads playlist not found for channel');
            }
            // Paginate through playlist items
            do {
                const playlistRes = await this.youtube.playlistItems.list({
                    part: ['snippet', 'contentDetails'],
                    playlistId: uploadsPlaylistId,
                    maxResults: 50,
                    pageToken: nextPageToken,
                });
                const videoIds = playlistRes.data.items?.map(item => item.contentDetails?.videoId).filter(Boolean);
                if (videoIds.length > 0) {
                    // Fetch full video details including statistics and contentDetails
                    const videoRes = await this.youtube.videos.list({
                        part: ['snippet', 'statistics', 'contentDetails', 'status'],
                        id: videoIds,
                    });
                    const videos = videoRes.data.items || [];
                    if (publishedAfter) {
                        const filtered = videos.filter(v => new Date(v.snippet.publishedAt) > new Date(publishedAfter));
                        allVideos = [...allVideos, ...filtered];
                        // If we found older videos in this page, we can potentially break early if youtube returns them chronologically
                    }
                    else {
                        allVideos = [...allVideos, ...videos];
                    }
                }
                nextPageToken = playlistRes.data.nextPageToken || undefined;
            } while (nextPageToken);
            return allVideos;
        }
        catch (error) {
            logger_1.logger.error('YouTube API Error:', error.message);
            if (error.code === 403) {
                throw new appError_1.InternalServerError('YouTube API quota exceeded or forbidden.');
            }
            throw new appError_1.InternalServerError('Failed to fetch videos from YouTube.');
        }
    }
    extractBestThumbnail(thumbnails) {
        if (!thumbnails)
            return null;
        return (thumbnails.maxres?.url ||
            thumbnails.high?.url ||
            thumbnails.medium?.url ||
            thumbnails.standard?.url ||
            thumbnails.default?.url ||
            null);
    }
    parseDuration(ptDuration) {
        // Basic ISO 8601 duration parser (PT#M#S)
        const match = ptDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match)
            return 0;
        const hours = parseInt(match[1] || '0', 10);
        const minutes = parseInt(match[2] || '0', 10);
        const seconds = parseInt(match[3] || '0', 10);
        return hours * 3600 + minutes * 60 + seconds;
    }
}
exports.youtubeClient = new YoutubeClient();
