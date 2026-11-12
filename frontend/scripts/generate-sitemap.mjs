import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Build-Time XML Sitemap Generator for Aradhna Marg
 *
 * NOTE ON DEPLOYMENT LIFECYCLE:
 * Newly published content (Bhajans, Articles, Festivals, Puranas, Deities, Categories)
 * appears in the production sitemap (https://aradhnamarg.com/sitemap.xml) after
 * the next frontend build and Vercel deployment. Runtime sitemap generation is
 * not performed on Render's ephemeral filesystem.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.VITE_SITE_URL || 'https://aradhnamarg.com';
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
const ADS_TXT_PATH = path.join(PUBLIC_DIR, 'ads.txt');
const API_URL =
  process.env.VITE_API_BASE_URL ||
  process.env.VITE_API_URL ||
  process.env.API_URL ||
  'https://api.aradhnamarg.com/api/v1';

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
  { path: 'terms', changefreq: 'monthly', priority: '0.3' },
  { path: 'privacy', changefreq: 'monthly', priority: '0.3' },
  { path: 'disclaimer', changefreq: 'monthly', priority: '0.3' }
];

const KNOWN_CATEGORY_SLUGS = {
  '3d4327b6-fcfa-486b-8be0-80f1c665ac90': 'morning-bhajans',
  'fc9b13c2-1fa1-4e77-8540-41efd12712d6': 'evening-bhajans',
  'bd662894-5aca-4137-87fa-e653ca741982': 'bhajan-collection',
  'ef8290b2-dde5-4b57-b404-3179ce5b034e': 'aarti-collection',
  '6b238d34-47e1-4d79-996b-e3545afe685a': 'chalisa-collection',
  '4f5a78bc-cace-40e8-851f-dc3bd8f1ab20': 'puranas-collection',
  '508f8521-7372-4cd4-924c-a6b0c8809e0e': 'mantras',
  'ec40b50e-b65a-423f-ae2b-e2f0b7932c7f': 'stotra-collection',
  '8b1cd670-eee4-4ec5-9214-467d22bde516': 'spiritual-articles',
  '257ffa33-0499-4db1-ae2e-cb83ca6009d6': 'festival-special'
};

const KNOWN_DEITY_SLUGS = {
  '6a6ad977-9ee1-490b-9d71-aefc2b5678ba': 'lord-ganesh',
  'c9e60b70-bf47-47fb-b6d7-e67f8632b814': 'maa-durga',
  'f1326c55-c8db-46ab-982a-95c8fc332246': 'lord-vishnu',
  'ecd78b9d-f10d-47d1-bf14-e0a1d49207ec': 'lord-krishna',
  'dba51bb2-4321-49a1-9df2-014c1d205667': 'lord-ram',
  'c05d8f75-563d-48e5-8e4b-554492cbc5fe': 'lord-shiva',
  '27cbd460-7220-4599-af02-939a01359855': 'shri-radha-rani',
  'a7f4bb79-e5f2-4c85-87f5-2941a5840f2b': 'lord-hanuman',
  'c106e63c-bcc0-4656-a154-e857aed69310': 'yamuna-maiya',
  'ad094763-d8bd-4c45-8af1-fcb5be884ac1': 'surya-dev',
  'c8eb3ecc-002d-45a9-b438-0e6268e72a9f': 'chhathi-maiya',
  'ed0a6717-3668-4f31-8b6d-47dc25806570': 'maa-saraswati',
  'bb8f9244-5009-4a96-8e19-d6b5b1a86bb0': 'mata-lakshmi',
  'c4542680-eb5d-4a19-8425-2ff48883daa7': 'mata-parvati'
};

async function fetchFromApi(endpoint, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout for cold start
      const res = await fetch(`${API_URL}${endpoint}`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const json = await res.json();
      if (!json || typeof json !== 'object' || !Array.isArray(json.data)) {
        throw new Error(`Invalid response structure: expected json.data array`);
      }
      return json.data;
    } catch (err) {
      console.warn(`[Sitemap] Attempt ${attempt}/${retries} failed for ${endpoint}: ${err.message}`);
      if (attempt === retries) {
        throw new Error(`Failed to fetch ${endpoint} after ${retries} attempts: ${err.message}`);
      }
      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
  return [];
}

function validateSitemapXml(xml) {
  if (!xml || typeof xml !== 'string') {
    throw new Error('Sitemap XML is empty or not a string.');
  }
  if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
    throw new Error('Sitemap XML missing standard XML declaration header.');
  }
  if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
    throw new Error('Sitemap XML missing <urlset> root with valid xmlns attribute.');
  }
  if (!xml.endsWith('</urlset>')) {
    throw new Error('Sitemap XML does not end with closing </urlset> tag.');
  }

  // Tag count balance checks
  const openUrlCount = (xml.match(/<url>/g) || []).length;
  const closeUrlCount = (xml.match(/<\/url>/g) || []).length;
  if (openUrlCount === 0 || openUrlCount !== closeUrlCount) {
    throw new Error(`Sitemap XML has unbalanced <url> tags (open: ${openUrlCount}, close: ${closeUrlCount}).`);
  }

  const openLocCount = (xml.match(/<loc>/g) || []).length;
  const closeLocCount = (xml.match(/<\/loc>/g) || []).length;
  if (openLocCount !== closeLocCount || openLocCount !== openUrlCount) {
    throw new Error(`Sitemap XML has mismatch in <loc> tags (loc: ${openLocCount}, url: ${openUrlCount}).`);
  }

  // URL hygiene checks: disallow admin, auth, internal, or non-canonical paths
  const locMatches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
  for (const match of locMatches) {
    const locUrl = match[1];
    if (!locUrl.startsWith('https://') && !locUrl.startsWith('http://')) {
      throw new Error(`Invalid URL format in sitemap: ${locUrl}`);
    }
    if (
      locUrl.includes('/admin') ||
      locUrl.includes('/api') ||
      locUrl.includes('/auth') ||
      locUrl.includes('/search') ||
      locUrl.includes('/preview')
    ) {
      throw new Error(`Sitemap contains prohibited non-public route: ${locUrl}`);
    }
  }

  return openUrlCount;
}

async function generateSitemap() {
  console.log('[Sitemap] Generating sitemap.xml for', BASE_URL);
  console.log('[Sitemap] Fetching published content from API:', API_URL);

  const today = new Date().toISOString().split('T')[0];
  const urlEntries = [];

  // 1. Add static public routes
  for (const route of STATIC_ROUTES) {
    const loc = route.path ? `${BASE_URL}/${route.path}` : `${BASE_URL}/`;
    urlEntries.push(`  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`);
  }

  // 2. Fetch dynamic published routes from Public API
  const [bhajans, articles, festivals, puranas, deities, categories] = await Promise.all([
    fetchFromApi('/public/bhajans?limit=1000'),
    fetchFromApi('/public/articles?limit=1000'),
    fetchFromApi('/public/festivals?limit=1000'),
    fetchFromApi('/public/puranas?limit=1000'),
    fetchFromApi('/public/deities?limit=1000'),
    fetchFromApi('/public/categories?limit=1000')
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
    const identifier = KNOWN_CATEGORY_SLUGS[item.id] || item.slug || item.id;
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
    const identifier = KNOWN_DEITY_SLUGS[item.id] || item.slug || item.id;
    if (!identifier) continue;
    const date = (item.updated_at || item.created_at || today).split('T')[0];
    urlEntries.push(`  <url>
    <loc>${BASE_URL}/gods/${encodeURIComponent(identifier)}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }

  console.log(
    `[Sitemap] Added dynamic entries: ${bhajans.length} bhajans, ${articles.length} articles, ${festivals.length} festivals, ${puranas.length} puranas, ${categories.length} categories, ${deities.length} deities.`
  );

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>
`.trim();

  // Validate XML before writing
  const validUrlCount = validateSitemapXml(sitemapXml);
  console.log(`[Sitemap] Validation passed: ${validUrlCount} URLs verified.`);

  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  fs.writeFileSync(SITEMAP_PATH, sitemapXml + '\n', 'utf-8');
  console.log(`[Sitemap] Successfully wrote ${validUrlCount} URLs to ${SITEMAP_PATH}`);

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
  console.error('[Sitemap] Critical error generating sitemap:', err.message);
  process.exit(1);
});
