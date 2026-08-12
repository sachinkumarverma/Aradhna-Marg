import { db } from '@common/database/DatabaseClient';
import { Settings, UpdateSettingsDTO } from '@models/Settings';

export class SettingsRepository {
  private readonly tableName = 'settings';

  private mapToModel(row: any): Settings {
    return {
      id: row.id,
      siteName: row.site_name,
      siteDescription: row.site_description,
      siteLogo: row.site_logo,
      favicon: row.favicon,
      defaultLanguage: row.default_language,
      defaultTheme: row.default_theme,
      copyrightText: row.copyright_text,
      timezone: row.timezone,
      dateFormat: row.date_format,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      contactAddress: row.contact_address,
      whatsappNumber: row.whatsapp_number,
      facebookUrl: row.facebook_url,
      instagramUrl: row.instagram_url,
      youtubeUrl: row.youtube_url,
      twitterUrl: row.twitter_url,
      linkedinUrl: row.linkedin_url,
      youtubeChannelId: row.youtube_channel_id,
      youtubeChannelUrl: row.youtube_channel_url,
      youtubeAutoSync: row.youtube_auto_sync,
      youtubeSyncInterval: row.youtube_sync_interval,
      youtubeIncrementalSync: row.youtube_incremental_sync,
      youtubeLastSync: row.youtube_last_sync,
      youtubeNextSync: row.youtube_next_sync,
      seoSiteTitle: row.seo_site_title,
      seoMetaDescription: row.seo_meta_description,
      seoMetaKeywords: row.seo_meta_keywords,
      seoRobots: row.seo_robots,
      seoCanonicalDomain: row.seo_canonical_domain,
      seoOgImage: row.seo_og_image,
      googleAnalyticsId: row.google_analytics_id,
      googleSearchConsole: row.google_search_console,
      microsoftClarity: row.microsoft_clarity,
      enableAnalytics: row.enable_analytics,
      enableAds: row.enable_ads,
      adTopBanner: row.ad_top_banner,
      adInline: row.ad_inline,
      adSidebar: row.ad_sidebar,
      adFooter: row.ad_footer,
      maintenanceMode: row.maintenance_mode,
      enableRegistration: row.enable_registration,
      enableComments: row.enable_comments,
      enableCache: row.enable_cache,
      enablePdfGeneration: row.enable_pdf_generation,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapToDb(dto: UpdateSettingsDTO): any {
    const dbData: any = {};
    if (dto.siteName !== undefined) dbData.site_name = dto.siteName;
    if (dto.siteDescription !== undefined) dbData.site_description = dto.siteDescription;
    if (dto.siteLogo !== undefined) dbData.site_logo = dto.siteLogo;
    if (dto.favicon !== undefined) dbData.favicon = dto.favicon;
    if (dto.defaultLanguage !== undefined) dbData.default_language = dto.defaultLanguage;
    if (dto.defaultTheme !== undefined) dbData.default_theme = dto.defaultTheme;
    if (dto.copyrightText !== undefined) dbData.copyright_text = dto.copyrightText;
    if (dto.timezone !== undefined) dbData.timezone = dto.timezone;
    if (dto.dateFormat !== undefined) dbData.date_format = dto.dateFormat;
    if (dto.contactEmail !== undefined) dbData.contact_email = dto.contactEmail;
    if (dto.contactPhone !== undefined) dbData.contact_phone = dto.contactPhone;
    if (dto.contactAddress !== undefined) dbData.contact_address = dto.contactAddress;
    if (dto.whatsappNumber !== undefined) dbData.whatsapp_number = dto.whatsappNumber;
    if (dto.facebookUrl !== undefined) dbData.facebook_url = dto.facebookUrl;
    if (dto.instagramUrl !== undefined) dbData.instagram_url = dto.instagramUrl;
    if (dto.youtubeUrl !== undefined) dbData.youtube_url = dto.youtubeUrl;
    if (dto.twitterUrl !== undefined) dbData.twitter_url = dto.twitterUrl;
    if (dto.linkedinUrl !== undefined) dbData.linkedin_url = dto.linkedinUrl;
    if (dto.youtubeChannelId !== undefined) dbData.youtube_channel_id = dto.youtubeChannelId;
    if (dto.youtubeChannelUrl !== undefined) dbData.youtube_channel_url = dto.youtubeChannelUrl;
    if (dto.youtubeAutoSync !== undefined) dbData.youtube_auto_sync = dto.youtubeAutoSync;
    if (dto.youtubeSyncInterval !== undefined) dbData.youtube_sync_interval = dto.youtubeSyncInterval;
    if (dto.youtubeIncrementalSync !== undefined) dbData.youtube_incremental_sync = dto.youtubeIncrementalSync;
    if (dto.youtubeLastSync !== undefined) dbData.youtube_last_sync = dto.youtubeLastSync;
    if (dto.youtubeNextSync !== undefined) dbData.youtube_next_sync = dto.youtubeNextSync;
    if (dto.seoSiteTitle !== undefined) dbData.seo_site_title = dto.seoSiteTitle;
    if (dto.seoMetaDescription !== undefined) dbData.seo_meta_description = dto.seoMetaDescription;
    if (dto.seoMetaKeywords !== undefined) dbData.seo_meta_keywords = dto.seoMetaKeywords;
    if (dto.seoRobots !== undefined) dbData.seo_robots = dto.seoRobots;
    if (dto.seoCanonicalDomain !== undefined) dbData.seo_canonical_domain = dto.seoCanonicalDomain;
    if (dto.seoOgImage !== undefined) dbData.seo_og_image = dto.seoOgImage;
    if (dto.googleAnalyticsId !== undefined) dbData.google_analytics_id = dto.googleAnalyticsId;
    if (dto.googleSearchConsole !== undefined) dbData.google_search_console = dto.googleSearchConsole;
    if (dto.microsoftClarity !== undefined) dbData.microsoft_clarity = dto.microsoftClarity;
    if (dto.enableAnalytics !== undefined) dbData.enable_analytics = dto.enableAnalytics;
    if (dto.enableAds !== undefined) dbData.enable_ads = dto.enableAds;
    if (dto.adTopBanner !== undefined) dbData.ad_top_banner = dto.adTopBanner;
    if (dto.adInline !== undefined) dbData.ad_inline = dto.adInline;
    if (dto.adSidebar !== undefined) dbData.ad_sidebar = dto.adSidebar;
    if (dto.adFooter !== undefined) dbData.ad_footer = dto.adFooter;
    if (dto.maintenanceMode !== undefined) dbData.maintenance_mode = dto.maintenanceMode;
    if (dto.enableRegistration !== undefined) dbData.enable_registration = dto.enableRegistration;
    if (dto.enableComments !== undefined) dbData.enable_comments = dto.enableComments;
    if (dto.enableCache !== undefined) dbData.enable_cache = dto.enableCache;
    if (dto.enablePdfGeneration !== undefined) dbData.enable_pdf_generation = dto.enablePdfGeneration;

    dbData.updated_at = new Date().toISOString();
    return dbData;
  }

  async getSettings(): Promise<Settings | null> {
    const { rows } = await db.query(`SELECT * FROM ${this.tableName} LIMIT 1`);
    if (rows.length === 0) return null;
    return this.mapToModel(rows[0]);
  }

  async updateSettings(id: string, updates: UpdateSettingsDTO): Promise<Settings> {
    const dbData = this.mapToDb(updates);
    const keys = Object.keys(dbData);
    const values = Object.values(dbData);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    values.push(id);

    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = $${values.length} RETURNING *`;
    const { rows } = await db.query(query, values);

    return this.mapToModel(rows[0]);
  }

  async createInitialSettings(updates: UpdateSettingsDTO): Promise<Settings> {
    const dbData = this.mapToDb(updates);
    dbData.is_singleton = true;

    const keys = Object.keys(dbData);
    const values = Object.values(dbData);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const query = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await db.query(query, values);

    return this.mapToModel(rows[0]);
  }
}

export const settingsRepository = new SettingsRepository();
