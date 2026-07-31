"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manualSyncSchema = void 0;
const zod_1 = require("zod");
exports.manualSyncSchema = zod_1.z.object({
    body: zod_1.z.object({
        channelId: zod_1.z.string().min(1, 'Channel ID is required'),
        fullSync: zod_1.z.boolean().optional().default(false),
    }),
});
