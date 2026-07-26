import { z } from 'zod';

export const updateSettingsSchema = z.object({
  siteName: z.string().optional(),
  siteDescription: z.string().optional(),
  siteLogo: z.string().url().optional().or(z.literal('')),
  favicon: z.string().url().optional().or(z.literal('')),
  defaultLanguage: z.string().optional(),
  defaultTheme: z.string().optional(),
  copyrightText: z.string().optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),

  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  contactAddress: z.string().optional(),
  whatsappNumber: z.string().optional(),

  facebookUrl: z.string().url().optional().or(z.literal('')),
  instagramUrl: z.string().url().optional().or(z.literal('')),
  youtubeUrl: z.string().url().optional().or(z.literal('')),
  twitterUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),

  youtubeChannelId: z.string().optional(),
  youtubeChannelUrl: z.string().url().optional().or(z.literal('')),
  youtubeAutoSync: z.boolean().optional(),
  youtubeSyncInterval: z.string().optional(),
  youtubeIncrementalSync: z.boolean().optional(),
  youtubeLastSync: z.string().optional(),
  youtubeNextSync: z.string().optional(),


  seoSiteTitle: z.string().optional(),
  seoMetaDescription: z.string().optional(),
  seoMetaKeywords: z.string().optional(),
  seoRobots: z.string().optional(),
  seoCanonicalDomain: z.string().url().optional().or(z.literal('')),
  seoOgImage: z.string().url().optional().or(z.literal('')),

  googleAnalyticsId: z.string().optional(),
  googleSearchConsole: z.string().optional(),
  microsoftClarity: z.string().optional(),
  enableAnalytics: z.boolean().optional(),


  enableAds: z.boolean().optional(),
  adTopBanner: z.string().optional(),
  adInline: z.string().optional(),
  adSidebar: z.string().optional(),
  adFooter: z.string().optional(),

  maintenanceMode: z.boolean().optional(),
  enableRegistration: z.boolean().optional(),
  enableComments: z.boolean().optional(),
  enableCache: z.boolean().optional(),
  enablePdfGeneration: z.boolean().optional(),
});
