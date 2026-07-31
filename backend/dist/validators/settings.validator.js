"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemSettingsSchema = exports.advertisementSettingsSchema = exports.analyticsSettingsSchema = exports.seoSettingsSchema = exports.youtubeSettingsSchema = exports.socialSettingsSchema = exports.contactSettingsSchema = exports.generalSettingsSchema = exports.updateSettingsSchema = void 0;
const zod_1 = require("zod");
// ── Legacy full-schema (kept for the existing GET flow) ──────────────────────
exports.updateSettingsSchema = zod_1.z.object({
    siteName: zod_1.z.string().nullish(),
    siteDescription: zod_1.z.string().nullish(),
    siteLogo: zod_1.z.string().url().nullish().or(zod_1.z.literal('').nullish()),
    favicon: zod_1.z.string().url().nullish().or(zod_1.z.literal('').nullish()),
    defaultLanguage: zod_1.z.string().nullish(),
    defaultTheme: zod_1.z.string().nullish(),
    copyrightText: zod_1.z.string().nullish(),
    timezone: zod_1.z.string().nullish(),
    dateFormat: zod_1.z.string().nullish(),
    contactEmail: zod_1.z.string().email().nullish().or(zod_1.z.literal('').nullish()),
    contactPhone: zod_1.z.string().nullish(),
    contactAddress: zod_1.z.string().nullish(),
    whatsappNumber: zod_1.z.string().nullish(),
    facebookUrl: zod_1.z.string().url().nullish().or(zod_1.z.literal('').nullish()),
    instagramUrl: zod_1.z.string().url().nullish().or(zod_1.z.literal('').nullish()),
    youtubeUrl: zod_1.z.string().url().nullish().or(zod_1.z.literal('').nullish()),
    twitterUrl: zod_1.z.string().url().nullish().or(zod_1.z.literal('').nullish()),
    linkedinUrl: zod_1.z.string().url().nullish().or(zod_1.z.literal('').nullish()),
    youtubeChannelId: zod_1.z.string().nullish(),
    youtubeChannelUrl: zod_1.z.string().url().nullish().or(zod_1.z.literal('').nullish()),
    youtubeAutoSync: zod_1.z.boolean().nullish(),
    youtubeSyncInterval: zod_1.z.string().nullish(),
    youtubeIncrementalSync: zod_1.z.boolean().nullish(),
    youtubeLastSync: zod_1.z.string().nullish(),
    youtubeNextSync: zod_1.z.string().nullish(),
    seoSiteTitle: zod_1.z.string().nullish(),
    seoMetaDescription: zod_1.z.string().nullish(),
    seoMetaKeywords: zod_1.z.string().nullish(),
    seoRobots: zod_1.z.string().nullish(),
    seoCanonicalDomain: zod_1.z.string().url().nullish().or(zod_1.z.literal('').nullish()),
    seoOgImage: zod_1.z.string().url().nullish().or(zod_1.z.literal('').nullish()),
    googleAnalyticsId: zod_1.z.string().nullish(),
    googleSearchConsole: zod_1.z.string().nullish(),
    microsoftClarity: zod_1.z.string().nullish(),
    enableAnalytics: zod_1.z.boolean().nullish(),
    enableAds: zod_1.z.boolean().nullish(),
    adTopBanner: zod_1.z.string().nullish(),
    adInline: zod_1.z.string().nullish(),
    adSidebar: zod_1.z.string().nullish(),
    adFooter: zod_1.z.string().nullish(),
    maintenanceMode: zod_1.z.boolean().nullish(),
    enableRegistration: zod_1.z.boolean().nullish(),
    enableComments: zod_1.z.boolean().nullish(),
    enableCache: zod_1.z.boolean().nullish(),
    enablePdfGeneration: zod_1.z.boolean().nullish(),
});
// ── Per-section schemas ──────────────────────────────────────────────────────
exports.generalSettingsSchema = zod_1.z.object({
    siteName: zod_1.z.string().nullish(),
    siteDescription: zod_1.z.string().nullish(),
    siteLogo: zod_1.z.string().url().nullish().or(zod_1.z.literal('').nullish()),
    favicon: zod_1.z.string().url().nullish().or(zod_1.z.literal('').nullish()),
    defaultLanguage: zod_1.z.string().nullish(),
    defaultTheme: zod_1.z.string().nullish(),
    copyrightText: zod_1.z.string().nullish(),
    timezone: zod_1.z.string().nullish(),
    dateFormat: zod_1.z.string().nullish(),
});
exports.contactSettingsSchema = zod_1.z.object({
    contactEmail: zod_1.z.string().email().nullish().or(zod_1.z.literal('').nullish()),
    contactPhone: zod_1.z.string().nullish(),
    contactAddress: zod_1.z.string().nullish(),
    whatsappNumber: zod_1.z.string().nullish(),
});
exports.socialSettingsSchema = zod_1.z.object({
    facebookUrl: zod_1.z.string().url().nullish().or(zod_1.z.literal('').nullish()),
    instagramUrl: zod_1.z.string().url().nullish().or(zod_1.z.literal('').nullish()),
    youtubeUrl: zod_1.z.string().url().nullish().or(zod_1.z.literal('').nullish()),
    twitterUrl: zod_1.z.string().url().nullish().or(zod_1.z.literal('').nullish()),
    linkedinUrl: zod_1.z.string().url().nullish().or(zod_1.z.literal('').nullish()),
});
exports.youtubeSettingsSchema = zod_1.z.object({
    youtubeChannelId: zod_1.z.string().nullish(),
    youtubeChannelUrl: zod_1.z.string().url().nullish().or(zod_1.z.literal('').nullish()),
    youtubeAutoSync: zod_1.z.boolean().nullish(),
    youtubeSyncInterval: zod_1.z.string().nullish(),
    youtubeIncrementalSync: zod_1.z.boolean().nullish(),
});
exports.seoSettingsSchema = zod_1.z.object({
    seoSiteTitle: zod_1.z.string().nullish(),
    seoMetaDescription: zod_1.z.string().nullish(),
    seoMetaKeywords: zod_1.z.string().nullish(),
    seoRobots: zod_1.z.string().nullish(),
    seoCanonicalDomain: zod_1.z.string().url().nullish().or(zod_1.z.literal('').nullish()),
    seoOgImage: zod_1.z.string().url().nullish().or(zod_1.z.literal('').nullish()),
});
exports.analyticsSettingsSchema = zod_1.z.object({
    googleAnalyticsId: zod_1.z.string().nullish(),
    googleSearchConsole: zod_1.z.string().nullish(),
    microsoftClarity: zod_1.z.string().nullish(),
    enableAnalytics: zod_1.z.boolean().nullish(),
});
exports.advertisementSettingsSchema = zod_1.z.object({
    enableAds: zod_1.z.boolean().nullish(),
    adTopBanner: zod_1.z.string().nullish(),
    adInline: zod_1.z.string().nullish(),
    adSidebar: zod_1.z.string().nullish(),
    adFooter: zod_1.z.string().nullish(),
});
exports.systemSettingsSchema = zod_1.z.object({
    maintenanceMode: zod_1.z.boolean().nullish(),
    enableRegistration: zod_1.z.boolean().nullish(),
    enableComments: zod_1.z.boolean().nullish(),
    enableCache: zod_1.z.boolean().nullish(),
    enablePdfGeneration: zod_1.z.boolean().nullish(),
});
