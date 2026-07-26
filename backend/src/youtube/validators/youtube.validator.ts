import { z } from 'zod';

export const manualSyncSchema = z.object({
  body: z.object({
    channelId: z.string().min(1, 'Channel ID is required'),
    fullSync: z.boolean().optional().default(false),
  }),
});
