import { z } from 'zod';

// ── Legacy full-schema (kept for the existing GET flow) ──────────────────────
export const updateSettingsSchema = z.object({
  siteName: z.string().nullish(),
  siteDescription: z.string().nullish(),
  siteLogo: z.string().url().nullish().or(z.literal('').nullish()),
  favicon: z.string().url().nullish().or(z.literal('').nullish()),
  defaultLanguage: z.string().nullish(),
  defaultTheme: z.string().nullish(),
  copyrightText: z.string().nullish(),
  timezone: z.string().nullish(),
  dateFormat: z.string().nullish(),
  contactEmail: z.string().email().nullish().or(z.literal('').nullish()),
  contactPhone: z.string().nullish(),
  contactAddress: z.string().nullish(),
  whatsappNumber: z.string().nullish(),
  facebookUrl: z.string().url().nullish().or(z.literal('').nullish()),
  instagramUrl: z.string().url().nullish().or(z.literal('').nullish()),
  youtubeUrl: z.string().url().nullish().or(z.literal('').nullish()),
  twitterUrl: z.string().url().nullish().or(z.literal('').nullish()),
  linkedinUrl: z.string().url().nullish().or(z.literal('').nullish()),
  youtubeChannelId: z.string().nullish(),
  youtubeChannelUrl: z.string().url().nullish().or(z.literal('').nullish()),
  youtubeAutoSync: z.boolean().nullish(),
  youtubeSyncInterval: z.string().nullish(),
  youtubeIncrementalSync: z.boolean().nullish(),
  youtubeLastSync: z.string().nullish(),
  youtubeNextSync: z.string().nullish(),
  seoSiteTitle: z.string().nullish(),
  seoMetaDescription: z.string().nullish(),
  seoMetaKeywords: z.string().nullish(),
  seoRobots: z.string().nullish(),
  seoCanonicalDomain: z.string().url().nullish().or(z.literal('').nullish()),
  seoOgImage: z.string().url().nullish().or(z.literal('').nullish()),
  googleAnalyticsId: z.string().nullish(),
  googleSearchConsole: z.string().nullish(),
  microsoftClarity: z.string().nullish(),
  enableAnalytics: z.boolean().nullish(),
  enableAds: z.boolean().nullish(),
  adTopBanner: z.string().nullish(),
  adInline: z.string().nullish(),
  adSidebar: z.string().nullish(),
  adFooter: z.string().nullish(),
  maintenanceMode: z.boolean().nullish(),
  enableRegistration: z.boolean().nullish(),
  enableComments: z.boolean().nullish(),
  enableCache: z.boolean().nullish(),
  enablePdfGeneration: z.boolean().nullish()
});

// ── Per-section schemas ──────────────────────────────────────────────────────

export const generalSettingsSchema = z.object({
  siteName: z.string().nullish(),
  siteDescription: z.string().nullish(),
  siteLogo: z.string().url().nullish().or(z.literal('').nullish()),
  favicon: z.string().url().nullish().or(z.literal('').nullish()),
  defaultLanguage: z.string().nullish(),
  defaultTheme: z.string().nullish(),
  copyrightText: z.string().nullish(),
  timezone: z.string().nullish(),
  dateFormat: z.string().nullish()
});

export const contactSettingsSchema = z.object({
  contactEmail: z.string().email().nullish().or(z.literal('').nullish()),
  contactPhone: z.string().nullish(),
  contactAddress: z.string().nullish(),
  whatsappNumber: z.string().nullish()
});

export const socialSettingsSchema = z.object({
  facebookUrl: z.string().url().nullish().or(z.literal('').nullish()),
  instagramUrl: z.string().url().nullish().or(z.literal('').nullish()),
  youtubeUrl: z.string().url().nullish().or(z.literal('').nullish()),
  twitterUrl: z.string().url().nullish().or(z.literal('').nullish()),
  linkedinUrl: z.string().url().nullish().or(z.literal('').nullish())
});

export const youtubeSettingsSchema = z.object({
  youtubeChannelId: z.string().nullish(),
  youtubeChannelUrl: z.string().url().nullish().or(z.literal('').nullish()),
  youtubeAutoSync: z.boolean().nullish(),
  youtubeSyncInterval: z.string().nullish(),
  youtubeIncrementalSync: z.boolean().nullish()
});

export const seoSettingsSchema = z.object({
  seoSiteTitle: z.string().nullish(),
  seoMetaDescription: z.string().nullish(),
  seoMetaKeywords: z.string().nullish(),
  seoRobots: z.string().nullish(),
  seoCanonicalDomain: z.string().url().nullish().or(z.literal('').nullish()),
  seoOgImage: z.string().url().nullish().or(z.literal('').nullish())
});

export const analyticsSettingsSchema = z.object({
  googleAnalyticsId: z.string().nullish(),
  googleSearchConsole: z.string().nullish(),
  microsoftClarity: z.string().nullish(),
  enableAnalytics: z.boolean().nullish()
});

export const advertisementSettingsSchema = z.object({
  enableAds: z.boolean().nullish(),
  adTopBanner: z.string().nullish(),
  adInline: z.string().nullish(),
  adSidebar: z.string().nullish(),
  adFooter: z.string().nullish()
});

export const systemSettingsSchema = z.object({
  maintenanceMode: z.boolean().nullish(),
  enableRegistration: z.boolean().nullish(),
  enableComments: z.boolean().nullish(),
  enableCache: z.boolean().nullish(),
  enablePdfGeneration: z.boolean().nullish()
});
