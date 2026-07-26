export interface Settings {
  id: string;
  // General
  siteName?: string;
  siteDescription?: string;
  siteLogo?: string;
  favicon?: string;
  defaultLanguage?: string;
  defaultTheme?: string;
  copyrightText?: string;
  timezone?: string;
  dateFormat?: string;
  
  // Contact
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  whatsappNumber?: string;
  
  // Social
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  
  // YouTube Automation
  youtubeChannelId?: string;
  youtubeChannelUrl?: string;
  youtubeAutoSync?: boolean;
  youtubeSyncInterval?: string;
  youtubeIncrementalSync?: boolean;
  youtubeLastSync?: string;
  youtubeNextSync?: string;
  

  // SEO
  seoSiteTitle?: string;
  seoMetaDescription?: string;
  seoMetaKeywords?: string;
  seoRobots?: string;
  seoCanonicalDomain?: string;
  seoOgImage?: string;
  
  // Analytics
  googleAnalyticsId?: string;
  googleSearchConsole?: string;
  microsoftClarity?: string;
  enableAnalytics?: boolean;
  

  // Advertisement
  enableAds?: boolean;
  adTopBanner?: string;
  adInline?: string;
  adSidebar?: string;
  adFooter?: string;
  
  // System
  maintenanceMode?: boolean;
  enableRegistration?: boolean;
  enableComments?: boolean;
  enableCache?: boolean;
  enablePdfGeneration?: boolean;

  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateSettingsDTO extends Partial<Omit<Settings, 'id' | 'createdAt' | 'updatedAt'>> {}
