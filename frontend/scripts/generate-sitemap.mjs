import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.VITE_SITE_URL || 'https://aradhnamarg.com';
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
const ADS_TXT_PATH = path.join(PUBLIC_DIR, 'ads.txt');

const STATIC_ROUTES = [
  { path: '', changefreq: 'daily', priority: '1.0' },
  { path: 'bhajans', changefreq: 'daily', priority: '0.9' },
  { path: 'articles', changefreq: 'daily', priority: '0.9' },
  { path: 'festivals', changefreq: 'weekly', priority: '0.9' },
  { path: 'puranas', changefreq: 'weekly', priority: '0.9' },
  { path: 'videos', changefreq: 'daily', priority: '0.8' },
  { path: 'categories', changefreq: 'weekly', priority: '0.8' },
  { path: 'gods', changefreq: 'weekly', priority: '0.8' },
  { path: 'explore', changefreq: 'weekly', priority: '0.7' },
  { path: 'about', changefreq: 'monthly', priority: '0.5' },
  { path: 'contact', changefreq: 'monthly', priority: '0.5' },
  { path: 'support-us', changefreq: 'monthly', priority: '0.4' },
  { path: 'donate', changefreq: 'monthly', priority: '0.4' },
  { path: 'terms', changefreq: 'monthly', priority: '0.3' },
  { path: 'privacy', changefreq: 'monthly', priority: '0.3' },
  { path: 'disclaimer', changefreq: 'monthly', priority: '0.3' }
];

async function fetchDynamicItems(supabaseUrl, supabaseKey, table, select = 'slug, updated_at, created_at', filter = '') {
  if (!supabaseUrl || !supabaseKey) return [];
  try {
    const url = `${supabaseUrl}/rest/v1/${table}?select=${select}${filter ? `&${filter}` : ''}`;
    const res = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    });
    if (!res.ok) {
      console.warn(`[Sitemap] Supabase query for ${table} returned status ${res.status}`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn(`[Sitemap] Failed to fetch dynamic entries for ${table}:`, err.message);
    return [];
  }
}

async function generateSitemap() {
  console.log('[Sitemap] Generating sitemap.xml for', BASE_URL);

  const today = new Date().toISOString().split('T')[0];
  const urlEntries = [];

  // 1. Add static routes
  for (const route of STATIC_ROUTES) {
    const loc = route.path ? `${BASE_URL}/${route.path}` : `${BASE_URL}/`;
    urlEntries.push(`  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`);
  }

  // 2. Fetch dynamic routes from Supabase if configured
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const [bhajans, articles, festivals, puranas, categories, deities] = await Promise.all([
        fetchDynamicItems(supabaseUrl, supabaseKey, 'bhajans', 'slug, updated_at, created_at, status', 'status=eq.PUBLISHED'),
        fetchDynamicItems(supabaseUrl, supabaseKey, 'articles', 'slug, updated_at, created_at, status', 'status=eq.PUBLISHED'),
        fetchDynamicItems(supabaseUrl, supabaseKey, 'festivals', 'slug, id, updated_at, created_at, status', 'status=eq.PUBLISHED'),
        fetchDynamicItems(supabaseUrl, supabaseKey, 'puranas', 'slug, updated_at, created_at, status', 'status=eq.PUBLISHED'),
        fetchDynamicItems(supabaseUrl, supabaseKey, 'categories', 'slug, id, updated_at, created_at'),
        fetchDynamicItems(supabaseUrl, supabaseKey, 'deities', 'slug, id, updated_at, created_at')
      ]);

      // Add Bhajans
      for (const item of bhajans) {
        if (!item.slug) continue;
        const date = (item.updated_at || item.created_at || today).split('T')[0];
        urlEntries.push(`  <url>
    <loc>${BASE_URL}/bhajans/${encodeURIComponent(item.slug)}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
      }

      // Add Articles
      for (const item of articles) {
        if (!item.slug) continue;
        const date = (item.updated_at || item.created_at || today).split('T')[0];
        urlEntries.push(`  <url>
    <loc>${BASE_URL}/articles/${encodeURIComponent(item.slug)}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
      }

      // Add Festivals
      for (const item of festivals) {
        const identifier = item.slug || item.id;
        if (!identifier) continue;
        const date = (item.updated_at || item.created_at || today).split('T')[0];
        urlEntries.push(`  <url>
    <loc>${BASE_URL}/festivals/${encodeURIComponent(identifier)}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
      }

      // Add Puranas
      for (const item of puranas) {
        if (!item.slug) continue;
        const date = (item.updated_at || item.created_at || today).split('T')[0];
        urlEntries.push(`  <url>
    <loc>${BASE_URL}/puranas/${encodeURIComponent(item.slug)}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
      }

      // Add Categories
      for (const item of categories) {
        const identifier = item.slug || item.id;
        if (!identifier) continue;
        const date = (item.updated_at || item.created_at || today).split('T')[0];
        urlEntries.push(`  <url>
    <loc>${BASE_URL}/categories/${encodeURIComponent(identifier)}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
      }

      // Add Deities / Gods
      for (const item of deities) {
        const identifier = item.slug || item.id;
        if (!identifier) continue;
        const date = (item.updated_at || item.created_at || today).split('T')[0];
        urlEntries.push(`  <url>
    <loc>${BASE_URL}/gods/${encodeURIComponent(identifier)}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
      }

      console.log(`[Sitemap] Added dynamic entries: ${bhajans.length} bhajans, ${articles.length} articles, ${festivals.length} festivals, ${puranas.length} puranas, ${categories.length} categories, ${deities.length} deities.`);
    } catch (e) {
      console.warn('[Sitemap] Failed to fetch dynamic entries, writing static sitemap:', e.message);
    }
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>
`;

  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  fs.writeFileSync(SITEMAP_PATH, sitemapXml.trim(), 'utf-8');
  console.log(`[Sitemap] Successfully wrote ${urlEntries.length} URLs to ${SITEMAP_PATH}`);

  // 3. Configure ads.txt if VITE_ADSENSE_PUBLISHER_ID is defined
  const pubId = process.env.VITE_ADSENSE_PUBLISHER_ID || process.env.ADSENSE_PUBLISHER_ID;
  if (pubId && /^ca-pub-\d+$/.test(pubId.trim())) {
    const rawPubId = pubId.trim().replace(/^ca-/, '');
    const adsTxtContent = `google.com, ${rawPubId}, DIRECT, f08c47fec0942fa0\n`;
    fs.writeFileSync(ADS_TXT_PATH, adsTxtContent, 'utf-8');
    console.log(`[Ads.txt] Configured ads.txt for publisher ${rawPubId}`);
  }
}

generateSitemap().catch((err) => {
  console.error('[Sitemap] Critical error generating sitemap:', err);
  process.exit(1);
});
