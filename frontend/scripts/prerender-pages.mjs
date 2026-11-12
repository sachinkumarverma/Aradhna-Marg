import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.VITE_SITE_URL || 'https://aradhnamarg.com';
const DIST_DIR = path.resolve(__dirname, '../dist');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');
const API_URL =
  process.env.VITE_API_BASE_URL ||
  process.env.VITE_API_URL ||
  process.env.API_URL ||
  'https://api.aradhnamarg.com/api/v1';

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

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttribute(str = '') {
  return String(str)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/"/g, '&quot;')
    .trim();
}

function stripHtml(html = '') {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatDevotionalText(content = '') {
  if (!content) return '';
  if (content.includes('<') && content.includes('>')) {
    return content.replace(/&nbsp;/g, ' ');
  }
  return escapeHtml(content).replace(/\n/g, '<br />');
}

async function fetchFromApi(endpoint, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout for Render cold start
      const res = await fetch(`${API_URL}${endpoint}`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`[Prerender] API ${endpoint} status: ${res.status}`);
        return [];
      }
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    } catch (err) {
      console.warn(`[Prerender] Attempt ${attempt}/${retries} failed for ${endpoint}: ${err.message}`);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
  }
  return [];
}

async function fetchDetailFromApi(endpoint, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(`${API_URL}${endpoint}`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
  return null;
}

function buildHtml(template, options) {
  let html = template;

  // Set html lang
  const lang = options.lang || 'hi';
  html = html.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);

  // Document Title
  const title = options.title
    ? `${options.title}`
    : 'आराधना मार्ग - भजनों, आरती, चालीसा, एवं पौराणिक कथाओं का पावन संग्रह | Aradhna Marg';
  html = html.replace(
    /<title[^>]*>[\s\S]*?<\/title>/,
    `<title data-prerender="true" data-rh="true">${escapeHtml(title)}</title>`
  );

  // Meta Description
  const description = options.description ? escapeAttribute(options.description).slice(0, 200) : '';
  html = html.replace(
    /<meta[^>]*name="description"[^>]*content="[^"]*"[^>]*\/?>/,
    `<meta data-prerender="true" data-rh="true" name="description" content="${description}" />`
  );

  // Meta Robots & Googlebot
  if (options.robots) {
    html = html.replace(
      /<meta[^>]*name="robots"[^>]*content="[^"]*"[^>]*\/?>/,
      `<meta data-prerender="true" data-rh="true" name="robots" content="${options.robots}" />`
    );
    html = html.replace(
      /<meta[^>]*name="googlebot"[^>]*content="[^"]*"[^>]*\/?>/,
      `<meta data-prerender="true" data-rh="true" name="googlebot" content="${options.robots}" />`
    );
  }

  // Canonical URL - strictly one canonical tag
  const canonicalUrl = options.canonicalUrl || BASE_URL;
  if (options.noCanonical) {
    html = html.replace(/<link[^>]*rel="canonical"[^>]*href="[^"]*"[^>]*\/?>\s*/, '');
  } else {
    html = html.replace(
      /<link[^>]*rel="canonical"[^>]*href="[^"]*"[^>]*\/?>/,
      `<link data-prerender="true" data-rh="true" rel="canonical" href="${canonicalUrl}" />`
    );
  }

  // OG tags
  html = html.replace(
    /<meta[^>]*property="og:title"[^>]*content="[^"]*"[^>]*\/?>/,
    `<meta data-prerender="true" data-rh="true" property="og:title" content="${escapeAttribute(title)}" />`
  );
  html = html.replace(
    /<meta[^>]*property="og:description"[^>]*content="[^"]*"[^>]*\/?>/,
    `<meta data-prerender="true" data-rh="true" property="og:description" content="${description}" />`
  );
  html = html.replace(
    /<meta[^>]*property="og:url"[^>]*content="[^"]*"[^>]*\/?>/,
    `<meta data-prerender="true" data-rh="true" property="og:url" content="${canonicalUrl}" />`
  );
  if (options.ogType) {
    html = html.replace(
      /<meta[^>]*property="og:type"[^>]*content="[^"]*"[^>]*\/?>/,
      `<meta data-prerender="true" data-rh="true" property="og:type" content="${options.ogType}" />`
    );
  }
  if (options.ogImage) {
    const fullImage = options.ogImage.startsWith('http')
      ? options.ogImage
      : `${BASE_URL}${options.ogImage.startsWith('/') ? '' : '/'}${options.ogImage}`;
    html = html.replace(
      /<meta[^>]*property="og:image"[^>]*content="[^"]*"[^>]*\/?>/,
      `<meta data-prerender="true" data-rh="true" property="og:image" content="${escapeAttribute(fullImage)}" />`
    );
    html = html.replace(
      /<meta[^>]*name="twitter:image"[^>]*content="[^"]*"[^>]*\/?>/,
      `<meta data-prerender="true" data-rh="true" name="twitter:image" content="${escapeAttribute(fullImage)}" />`
    );
  }

  // Twitter title & desc
  html = html.replace(
    /<meta[^>]*name="twitter:title"[^>]*content="[^"]*"[^>]*\/?>/,
    `<meta data-prerender="true" data-rh="true" name="twitter:title" content="${escapeAttribute(title)}" />`
  );
  html = html.replace(
    /<meta[^>]*name="twitter:description"[^>]*content="[^"]*"[^>]*\/?>/,
    `<meta data-prerender="true" data-rh="true" name="twitter:description" content="${description}" />`
  );

  // Structured Data (JSON-LD) - Replace existing default block cleanly
  if (options.schema) {
    const schemaScript = `<script data-prerender="true" data-rh="true" id="ld-json-schema" type="application/ld+json">\n${JSON.stringify(
      options.schema,
      null,
      2
    )}\n    </script>`;
    html = html.replace(/<script[^>]*id="ld-json-schema"[^>]*>[\s\S]*?<\/script>/, schemaScript);
  }

  // Initial Semantic Body Content inside <div id="root">
  // Serves full readable static content immediately to search engines, bots, and initial paint
  // before JavaScript executes. When React loads, it cleanly hydrates/mounts without flash.
  if (options.bodyHtml) {
    html = html.replace(
      /<div id="root">[\s\S]*?<\/div>(?=\s*(?:<script|<\/body>))/i,
      `<div id="root">\n${options.bodyHtml}\n    </div>`
    );
  }
  if (options.initialData) {
    const dataScript = `<script id="__PRERENDERED_DATA__" type="application/json">\n${JSON.stringify(
      options.initialData
    ).replace(/</g, '\\u003c')}\n</script>\n`;
    html = html.replace('</head>', `${dataScript}</head>`);
  }

  // Strip Google AdSense Auto Ads script completely from non-content / policy-excluded pages
  const normalizedRoute = (options.route || '').toLowerCase().trim();
  const isExcludedFromAds = [
    'privacy',
    'terms',
    'disclaimer',
    'contact',
    'support-us',
    'donate',
    'search',
    'favourite',
    'favorites',
    'admin'
  ].some((p) => normalizedRoute === p || normalizedRoute.startsWith(`${p}/`));

  if (isExcludedFromAds) {
    html = html.replace(
      /\s*<!-- Google AdSense Auto Ads -->\s*<script[^>]*src="[^"]*pagead2\.googlesyndication\.com[^"]*"[^>]*><\/script>/gi,
      ''
    );
    html = html.replace(/\s*<script[^>]*src="[^"]*pagead2\.googlesyndication\.com[^"]*"[^>]*><\/script>/gi, '');
  }

  return html;
}

function writeRoute(routePath, htmlContent) {
  if (!routePath || routePath === '') {
    // Write homepage
    fs.writeFileSync(path.join(DIST_DIR, 'index.html'), htmlContent, 'utf-8');
    return;
  }

  const targetDir = path.join(DIST_DIR, routePath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.writeFileSync(path.join(targetDir, 'index.html'), htmlContent, 'utf-8');
}

async function prerenderAll() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error('[Prerender] Error: dist/index.html not found! Run vite build first.');
    process.exit(1);
  }

  const baseTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  console.log('[Prerender] Starting static pre-rendering...');

  // Fetch all published data
  const [bhajans, articles, festivals, puranas, deities, categories, homeData] = await Promise.all([
    fetchFromApi('/public/bhajans?limit=1000'),
    fetchFromApi('/public/articles?limit=1000'),
    fetchFromApi('/public/festivals?limit=1000'),
    fetchFromApi('/public/puranas?limit=1000'),
    fetchFromApi('/public/deities?limit=1000'),
    fetchFromApi('/public/categories?limit=1000'),
    fetchDetailFromApi('/public/home')
  ]);

  let count = 0;

  // 1. Homepage & Static Collection Pages
  const staticPages = [
    {
      route: '',
      title: 'आराधना मार्ग - भजनों, आरती, चालीसा, एवं पौराणिक कथाओं का पावन संग्रह | Aradhna Marg',
      description:
        'आराधना मार्ग पर पाएं सम्पूर्ण सनातन भक्ति साहित्य, मधुर भजन, आरती, चालीसा, स्तोत्र, श्रीमद्भागवत व अष्टादश महापुराण और प्रमुख हिन्दू पर्वों की प्रामाणिक जानकारी।',
      h1: 'आराधना मार्ग - सम्पूर्ण सनातन भक्ति एवं पावन साहित्य',
      content:
        'सनातन धर्म, वेद, अष्टादश महापुराण, मधुर भजन, नित्य स्तोत्र, चालीसा, आरती एवं प्रमुख हिन्दू पर्वों का प्रामाणिक एवं भक्तिमय डिजिटल मंच।',
      sections: [
        {
          title: 'मधुर भजन संग्रह',
          url: '/bhajans',
          items: bhajans.slice(0, 6).map((b) => ({
            url: `/bhajans/${encodeURIComponent(b.slug || b.id)}`,
            title: b.hindi_title || b.title
          }))
        },
        {
          title: 'धार्मिक लेख एवं आध्यात्मिक ज्ञान',
          url: '/articles',
          items: articles.slice(0, 6).map((a) => ({
            url: `/articles/${encodeURIComponent(a.slug || a.id)}`,
            title: a.title
          }))
        },
        {
          title: 'प्रमुख हिन्दू पर्व एवं व्रत',
          url: '/festivals',
          items: festivals.slice(0, 4).map((f) => ({
            url: `/festivals/${encodeURIComponent(f.slug || f.id)}`,
            title: f.name
          }))
        },
        {
          title: 'अष्टादश महापुराण संग्रह',
          url: '/puranas',
          items: puranas.slice(0, 4).map((p) => ({
            url: `/puranas/${encodeURIComponent(p.slug || p.id)}`,
            title: p.title
          }))
        }
      ]
    },
    {
      route: 'bhajans',
      title: 'मधुर भजन संग्रह (Devotional Bhajans & Kirtans) | Aradhna Marg',
      description:
        'सनातन देवी-देवताओं के पावन एवं मधुर भजनों, आरतियों, चालीसा और स्तोत्रों का विशाल संग्रह। आनंद लें और प्रभु भक्ति में लीन हों।',
      h1: 'मधुर भजन संग्रह (Devotional Bhajans & Kirtans)',
      items: bhajans.map((b) => ({
        url: `/bhajans/${encodeURIComponent(b.slug || b.id)}`,
        title: b.hindi_title || b.title
      }))
    },
    {
      route: 'articles',
      title: 'धार्मिक लेख एवं आध्यात्मिक ज्ञान (Spiritual Articles) | Aradhna Marg',
      description:
        'सनातन धर्म, वेद, पुराण, देवी-देवताओं की महिमा और हिन्दू पर्वों के महत्व पर आधारित ज्ञानवर्धक एवं प्रामाणिक धार्मिक लेख।',
      h1: 'धार्मिक लेख एवं आध्यात्मिक ज्ञान (Spiritual Articles)',
      items: articles.map((a) => ({
        url: `/articles/${encodeURIComponent(a.slug || a.id)}`,
        title: a.title
      }))
    },
    {
      route: 'festivals',
      title: 'हिन्दू पर्व एवं प्रमुख व्रत (Sanatan Festivals & Vrats) | Aradhna Marg',
      description:
        'सनातन धर्म के समस्त प्रमुख त्योहारों, तिथियों, पूजा विधि और पौराणिक व्रतों की प्रामाणिक जानकारी व कथाएं।',
      h1: 'हिन्दू पर्व एवं प्रमुख व्रत (Sanatan Festivals & Vrats)',
      items: festivals.map((f) => ({
        url: `/festivals/${encodeURIComponent(f.slug || f.id)}`,
        title: f.name
      }))
    },
    {
      route: 'puranas',
      title: 'अष्टादश महापुराण (Sacred 18 Puranas) | Aradhna Marg',
      description:
        'महर्षि वेदव्यास रचित १८ महापुराणों का पावन संग्रह। कथाएं, उपदेश एवं आध्यात्मिक ज्ञान। सम्पूर्ण प्रामाणिक विवरण।',
      h1: 'अष्टादश महापुराण (Sacred 18 Puranas)',
      content:
        'महर्षि वेदव्यास रचित अष्टादश महापुराण (18 Sacred Puranas) सनातन धर्म के अमूल्य धार्मिक एवं दार्शनिक ग्रंथ हैं। इनमें सृष्टि की उत्पत्ति, देवी-देवताओं की दिव्य लीलाएं, तीर्थ महिमा, धर्म, योग, एवं मोक्ष का गहन ज्ञान संकलित है। आराधना मार्ग पर आप सभी १८ महापुराणों एवं प्रमुख वैदिक साहित्यों का पावन सार, कथाएं एवं प्रामाणिक विवरण निःशुल्क पढ़ सकते हैं एवं इनके मूल पीडीएफ भी डाउनलोड कर सकते हैं।',
      items: puranas.map((p) => ({
        url: `/puranas/${encodeURIComponent(p.slug || p.id)}`,
        title: p.title
      }))
    },
    {
      route: 'videos',
      title: 'भक्ति वीडियो एवं संकीर्तन (Devotional Videos) | Aradhna Marg',
      description: 'सनातन देवी-देवताओं के दिव्य भजन, आरती, संकीर्तन और पावन कथाओं के वीडियो देखें।',
      h1: 'भक्ति वीडियो एवं संकीर्तन (Devotional Videos)',
      content: 'आराधना मार्ग पर देवी-देवताओं के पावन भजनों व संकीर्तन के वीडियो का अवलोकन करें।',
      items: bhajans.slice(0, 12).map((b) => ({
        url: `/bhajans/${encodeURIComponent(b.slug || b.id)}`,
        title: b.hindi_title || b.title
      }))
    },
    {
      route: 'explore',
      title: 'आध्यात्मिक अन्वेषण (Explore Sanatan Dharma) | Aradhna Marg',
      description: 'सनातन धर्म के पावन भजनों, देवी-देवताओं, धार्मिक ग्रंथों एवं पर्वों का अन्वेषण करें।',
      h1: 'आध्यात्मिक अन्वेषण (Explore Sanatan Dharma)',
      content: 'सनातन संस्कृति के विभिन्न आयामों — भक्ति संगीत, पौराणिक साहित्य, और पर्व-उत्सवों का संग्रह।',
      items: [
        { url: '/bhajans', title: 'भजन संग्रह (Bhajans)' },
        { url: '/articles', title: 'धार्मिक लेख (Articles)' },
        { url: '/festivals', title: 'हिन्दू पर्व (Festivals)' },
        { url: '/puranas', title: 'महापुराण (Puranas)' },
        { url: '/gods', title: 'देवी-देवता दर्शन (Deities)' },
        { url: '/categories', title: 'भक्ति श्रेणियां (Categories)' }
      ]
    },
    {
      route: 'gods',
      title: 'सनातन देवी-देवता दर्शन एवं महिमा (Divine Deities) | Aradhna Marg',
      description:
        'सनातन धर्म के आराध्य देवी-देवताओं के स्वरूप, स्तोत्र, मंत्र और दिव्य कथाओं का सम्पूर्ण आध्यात्मिक संग्रह।',
      h1: 'सनातन देवी-देवता दर्शन एवं महिमा (Divine Deities)',
      content:
        'सनातन धर्म के प्रमुख आराध्य देवी-देवताओं—भगवान श्री गणेश, महादेव शिव, श्री कृष्ण, श्री राम, माँ दुर्गा, माँ लक्ष्मी एवं समस्त दिव्य स्वरूपों के पावन दर्शन, स्तुति, मंत्र, आरती एवं भजनों का अलौकिक संग्रह। जानिए प्रत्येक देवी-देवता के स्वरूप, उनके प्रिय मंत्र और आध्यात्मिक आराधना की विधि।',
      items: deities.map((d) => ({
        url: `/gods/${encodeURIComponent(KNOWN_DEITY_SLUGS[d.id] || d.slug || d.id)}`,
        title: d.name
      }))
    },
    {
      route: 'categories',
      title: 'भक्ति एवं आध्यात्मिक श्रेणियां (Categories) | Aradhna Marg',
      description: 'भजन, आरती, चालीसा, स्तोत्र, धार्मिक ग्रंथ एवं पौराणिक कथाओं की विषयवार श्रेणियां।',
      h1: 'भक्ति एवं आध्यात्मिक श्रेणियां (Categories)',
      content:
        'आराधना मार्ग पर समस्त सनातन धार्मिक साहित्य विषयवार श्रेणियों में वर्गीकृत है। प्रातःकालीन एवं संध्या भजन, नित्य वंदनीय आरती संग्रह, संकटमोचन चालीसा, फलदायी स्तोत्र, वेदोक्त महामंत्र, अष्टादश महापुराण एवं प्रेरणास्पद आध्यात्मिक लेखों का सम्पूर्ण संकलन।',
      items: categories.map((c) => ({
        url: `/categories/${encodeURIComponent(KNOWN_CATEGORY_SLUGS[c.id] || c.slug || c.id)}`,
        title: c.name
      }))
    },
    {
      route: 'support-us',
      title: 'सहयोग करें (Support Aradhna Marg) | Aradhna Marg',
      description: 'सनातन धर्म और भक्ति साहित्य के प्रसार में अपना पावन योगदान दें। आराधना मार्ग को सशक्त बनाएं।',
      h1: 'सहयोग करें (Support Aradhna Marg)',
      content:
        'आराधना मार्ग का उद्देश्य सनातन धर्म, मधुर भजनों, वेद-पुराणों और हिन्दू संस्कृति की पावन धरोहर को शुद्ध एवं प्रामाणिक रूप में डिजिटल युग में सहेजना और जन-जन तक निःशुल्क पहुंचाना है। आपके सूक्ष्म से सूक्ष्म सहयोग से इस आध्यात्मिक सेवा को सुचारू रूप से संचालित करने में बल मिलता है।'
    },
    {
      route: 'donate',
      title: 'सहयोग करें (Support Aradhna Marg) | Aradhna Marg',
      description: 'सनातन धर्म और भक्ति साहित्य के प्रसार में अपना पावन योगदान दें।',
      h1: 'सहयोग करें (Support Aradhna Marg)',
      canonicalUrl: `${BASE_URL}/support-us`,
      content: 'यह पृष्ठ /support-us पर पुनर्निर्देशित किया गया है।'
    },
    {
      route: 'search',
      title: 'खोजें (Search) | Aradhna Marg',
      description: 'भजन, आरती, चालीसा, स्तोत्र एवं धार्मिक लेख खोजें।',
      h1: 'खोजें (Search Aradhna Marg)',
      robots: 'noindex, follow',
      content: 'अपनी पसंद के भजन, कथाएं या धार्मिक लेख खोजें।'
    },
    {
      route: 'favorites',
      title: 'प्रिय भजन एवं लेख (Favorites) | Aradhna Marg',
      description: 'आपके द्वारा सहेजे गए प्रिय भजन और धार्मिक लेख।',
      h1: 'प्रिय भजन एवं लेख',
      robots: 'noindex, nofollow',
      content: 'आपके व्यक्तिगत रूप से सहेजे गए भक्ति संग्रह।'
    },
    {
      route: 'favourite',
      title: 'प्रिय भजन एवं लेख (Favorites) | Aradhna Marg',
      description: 'आपके द्वारा सहेजे गए प्रिय भजन और धार्मिक लेख।',
      h1: 'प्रिय भजन एवं लेख',
      robots: 'noindex, nofollow',
      content: 'आपके व्यक्तिगत रूप से सहेजे गए भक्ति संग्रह।'
    },
    {
      route: 'about',
      title: 'हमारे बारे में (About Us) | Aradhna Marg',
      description:
        'आराधना मार्ग का उद्देश्य सनातन धर्म के पावन साहित्य, मधुर भजनों और पौराणिक ग्रंथों को जन-जन तक पहुंचाना है।',
      h1: 'हमारे बारे में (About Us)',
      content: 'आराधना मार्ग (Aradhna Marg) सनातन धर्म और भक्ति साहित्य को समर्पित एक पावन डिजिटल मंच है।'
    },
    {
      route: 'contact',
      title: 'संपर्क करें (Contact Us) | Aradhna Marg',
      description: 'आराधना मार्ग टीम से संपर्क करें। अपने सुझाव, प्रश्न और भक्ति संदेश हमें भेजें।',
      h1: 'संपर्क करें (Contact Us)',
      content: 'आराधना मार्ग से जुड़ने अथवा किसी भी प्रकार की सहायता के लिए आप हमसे संपर्क कर सकते हैं।'
    },
    {
      route: 'terms',
      title: 'नियम एवं शर्तें (Terms & Conditions) | Aradhna Marg',
      description: 'आराधना मार्ग की उपयोग शर्तें एवं नियम।',
      h1: 'नियम एवं शर्तें (Terms & Conditions)',
      content: 'आराधना मार्ग का उपयोग करने से पहले कृपया इन नियमों एवं शर्तों को ध्यानपूर्वक पढ़ें।'
    },
    {
      route: 'privacy',
      title: 'गोपनीयता नीति (Privacy Policy) & Cookie Disclosures | Aradhna Marg',
      description:
        'आराधना मार्ग की आधिकारिक गोपनीयता नीति। जानें कि हम आपके डेटा, कुकीज़, Google AdSense विज्ञापनों, ऑपट-आउट और उपयोगकर्ता अधिकारों की सुरक्षा कैसे करते हैं।',
      h1: 'गोपनीयता नीति (Privacy Policy & Advertising Disclosures)',
      contentHtml: `
        <div style="line-height: 1.85; color: #334155; font-size: 1rem;">
          <p style="margin-bottom: 1.5rem; font-size: 1.1rem; background: #fff; padding: 1.5rem; border-radius: 12px; border: 1px solid #fed7aa;">
            <strong>आराधना मार्ग (aradhnamarg.com)</strong> सनातन धर्म का एक पावन भक्ति मंच है। हम अपने सभी पाठकों और श्रद्धालुओं की निजता का पूर्ण आदर करते हैं। यह नीति पत्र यह स्पष्ट रूप से प्रकट करता है कि जब आप हमारी वेबसाइट पर आते हैं, तो किस प्रकार की जानकारी एकत्रित की जाती है, कुकीज़ और तृतीय-पक्ष विज्ञापनदाता (विशेषकर Google AdSense) उसका क्या उपयोग करते हैं, तथा आपके पास अपनी प्राथमिकताओं को नियंत्रित करने के क्या विकल्प उपलब्ध हैं।
          </p>

          <section style="background: #fff; padding: 1.75rem; border-radius: 12px; border: 1px solid #fed7aa; margin-bottom: 1.5rem;">
            <h2 style="font-size: 1.4rem; font-weight: 700; color: #1c1917; margin-bottom: 0.75rem;">1. एकत्रित की जाने वाली जानकारी (Information We Collect)</h2>
            <p>हम अपनी वेबसाइट पर केवल आवश्यक एवं वैध उद्देश्यों के लिए ही जानकारी एकत्रित करते हैं:</p>
            <ul style="margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; line-height: 1.8;">
              <li><strong>स्वैच्छिक संपर्क जानकारी:</strong> जब आप संपर्क प्रपत्र (Contact Us) या प्रतिक्रिया भेजते हैं, तो आपका नाम, ईमेल पता और संदेश सुरक्षित रखा जाता है ताकि हम आपके प्रश्नों का उत्तर दे सकें।</li>
              <li><strong>सर्वर लॉग्स एवं तकनीकी डेटा:</strong> मानक वेब सर्वर सुरक्षा हेतु आपका ब्राउज़र प्रकार, डिवाइस श्रेणी, रेफ़रिंग यूआरएल, समय-मुहर एवं एनोनिमाइज़्ड आईपी पता लॉग किया जाता है।</li>
              <li><strong>स्थानीय प्राथमिकताएं (Local Storage):</strong> आपकी भाषा प्राथमिकता (हिंदी/अंग्रेजी), सहेजे गए पसंदीदा भजन (My Sangrah) एवं फ़ॉन्ट आकार आपके अपने ब्राउज़र में स्थानीय रूप से सुरक्षित रहते हैं।</li>
            </ul>
          </section>

          <section style="background: #fffbeb; padding: 1.75rem; border-radius: 12px; border: 2px solid #fde68a; margin-bottom: 1.5rem;">
            <h2 style="font-size: 1.4rem; font-weight: 700; color: #92400e; margin-bottom: 0.75rem;">2. Google AdSense एवं तृतीय-पक्ष विज्ञापन कुकीज़ (Google AdSense & Advertising Cookies)</h2>
            <p style="margin-bottom: 0.75rem;">आराधना मार्ग अपनी निःशुल्क भक्ति सेवाओं एवं सर्वर संचालन के खर्च वहन करने के लिए Google AdSense एवं अधिकृत विज्ञापन नेटवर्कों के विज्ञापनों का प्रदर्शन कर सकता है। Google की आधिकारिक प्रकाशक नीतियों (Google Publisher Policies) के अनुसार हम निम्नलिखित तथ्यों का प्रकटीकरण करते हैं:</p>
            <ul style="margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; line-height: 1.8;">
              <li><strong>तृतीय-पक्ष विक्रेता (Third-Party Vendors):</strong> Google सहित अन्य तृतीय-पक्ष विक्रेता उपयोगकर्ता द्वारा हमारी वेबसाइट अथवा इंटरनेट पर अन्य वेबसाइटों पर पूर्व में किए गए दौरों के आधार पर विज्ञापन प्रस्तुत करने हेतु <strong>कुकीज़ (Cookies)</strong> का उपयोग करते हैं।</li>
              <li><strong>व्यक्तिगत विज्ञापन (Personalized Ads):</strong> विज्ञापन कुकीज़ के उपयोग से Google और उसके साझेदार विज्ञापन नेटवर्कों को उपयोगकर्ता के आराधना मार्ग अथवा अन्य इंटरनेट साइटों पर भ्रमण के आधार पर प्रासंगिक विज्ञापन दिखाने की अनुमति मिलती है।</li>
              <li><strong>गैर-सामग्री पृष्ठों पर विज्ञापन निषेध:</strong> Google के नियमों के अनुरूप हम किसी भी गैर-सामग्री पृष्ठ जैसे गोपनीयता नीति, नियम, अस्वीकरण, संपर्क, खोज परिणाम या दान पृष्ठों पर विज्ञापन प्रदर्शित नहीं करते हैं।</li>
            </ul>
          </section>

          <section style="background: #fff; padding: 1.75rem; border-radius: 12px; border: 1px solid #fed7aa; margin-bottom: 1.5rem;">
            <h2 style="font-size: 1.4rem; font-weight: 700; color: #1c1917; margin-bottom: 0.75rem;">3. व्यक्तिगत विज्ञापनों से बाहर निकलने के विकल्प (Your Opt-Out Choices)</h2>
            <p style="margin-bottom: 0.75rem;">उपयोगकर्ता किसी भी समय व्यक्तिगत विज्ञापनों और ट्रैकिंग कुकीज़ से बाहर निकल सकते हैं। इसके लिए निम्नलिखित आधिकारिक टूल्स उपलब्ध हैं:</p>
            <ul style="margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; line-height: 1.8;">
              <li><strong>Google Ads Settings:</strong> उपयोगकर्ता अपनी विज्ञापन प्राथमिकताओं को प्रबंधित करने अथवा व्यक्तिगत विज्ञापन से बाहर निकलने हेतु <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer" style="color: #ea580c; font-weight: 600;">Google Ads Settings (adssettings.google.com)</a> पर जा सकते हैं।</li>
              <li><strong>AboutAds.info (DAA):</strong> उपयोगकर्ता डिजिटल एडवरटाइजिंग एलायंस के माध्यम से तृतीय-पक्ष कुकीज़ से बाहर निकलने हेतु <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" style="color: #ea580c; font-weight: 600;">www.aboutads.info/choices</a> का उपयोग कर सकते हैं।</li>
              <li><strong>Network Advertising Initiative (NAI):</strong> भाग लेने वाले विज्ञापन नेटवर्कों से बाहर निकलने हेतु <a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer" style="color: #ea580c; font-weight: 600;">optout.networkadvertising.org</a> पर जाएं।</li>
              <li><strong>Your Online Choices (Europe):</strong> यूरोपीय संघ एवं यूके के उपयोगकर्ता <a href="https://www.youronlinechoices.com/" target="_blank" rel="noopener noreferrer" style="color: #ea580c; font-weight: 600;">www.youronlinechoices.com</a> के माध्यम से विज्ञापन कुकीज़ प्रबंधित कर सकते हैं।</li>
              <li><strong>ब्राउज़र सेटिंग्स:</strong> इसके अतिरिक्त आप अपने वेब ब्राउज़र की सेटिंग्स में जाकर भी किसी भी समय सभी कुकीज़ को मिटा अथवा ब्लॉक कर सकते हैं।</li>
            </ul>
          </section>

          <section style="background: #fff; padding: 1.75rem; border-radius: 12px; border: 1px solid #fed7aa; margin-bottom: 1.5rem;">
            <h2 style="font-size: 1.4rem; font-weight: 700; color: #1c1917; margin-bottom: 0.75rem;">4. तृतीय-पक्ष विक्रेता एवं विज्ञापन नेटवर्क (Third-Party Ad Networks)</h2>
            <p style="margin-bottom: 0.75rem;">Google AdSense कार्यक्रम के तहत अधिकृत तृतीय-पक्ष विक्रेता और विज्ञापन नेटवर्क भी विज्ञापन प्रदर्शित कर सकते हैं। आप Google द्वारा प्रमाणित अधिकृत विज्ञापन प्रौद्योगिकी प्रदाताओं की आधिकारिक सूची निम्नलिखित लिंक पर देख सकते हैं:</p>
            <p><a href="https://support.google.com/adsense/answer/9012903" target="_blank" rel="noopener noreferrer" style="color: #ea580c; font-weight: 600;">Google Ad Technology Providers List (Google Help) →</a></p>
          </section>

          <section style="background: #fff; padding: 1.75rem; border-radius: 12px; border: 1px solid #fed7aa; margin-bottom: 1.5rem;">
            <h2 style="font-size: 1.4rem; font-weight: 700; color: #1c1917; margin-bottom: 0.75rem;">5. यूरोपीय संघ (EEA), यूके एवं स्विट्ज़रलैंड हेतु सहमति (Consent Handling for EEA, UK & Switzerland)</h2>
            <p style="margin-bottom: 0.75rem;">यूरोपीय आर्थिक क्षेत्र (EEA), यूके और स्विट्ज़रलैंड के उपयोगकर्ताओं के लिए हम <strong>GDPR</strong> एवं Google की <strong>EU User Consent Policy</strong> का कड़ाई से पालन करते हैं:</p>
            <ul style="margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; line-height: 1.8;">
              <li>विज्ञापन कुकीज़ एवं व्यक्तिगत डेटा केवल Google-प्रमाणित सहमति प्रबंधन प्लेटफ़ॉर्म (CMP) के माध्यम से उपयोगकर्ता की पूर्व, संसूचित सहमति प्राप्त करने के उपरांत ही सक्रिय किए जाते हैं।</li>
              <li>हम Google Consent Mode v2 एवं IAB Europe Transparency & Consent Framework (TCF v2.2) मानकों का पूर्ण अनुपालन करते हैं।</li>
              <li>उपयोगकर्ताओं को किसी भी समय अपनी सहमति वापस लेने अथवा बदलने का पूर्ण अधिकार है।</li>
            </ul>
          </section>

          <section style="background: #fff; padding: 1.75rem; border-radius: 12px; border: 1px solid #fed7aa; margin-bottom: 1.5rem;">
            <h2 style="font-size: 1.4rem; font-weight: 700; color: #1c1917; margin-bottom: 0.75rem;">6. डेटा सुरक्षा एवं संपर्क सूत्र (Data Security & Contact)</h2>
            <p>आराधना मार्ग किसी भी स्थिति में आपकी व्यक्तिगत जानकारी को व्यावसायिक लाभ अथवा डेटा ब्रोकरों को नहीं बेचता है। संपूर्ण वेबसाइट 256-बिट SSL/TLS एन्क्रिप्शन द्वारा सुरक्षित है। यदि आपके पास हमारी गोपनीयता नीति अथवा विज्ञापन नीतियों के संबंध में कोई प्रश्न है, तो कृपया हमसे <a href="/contact" style="color: #ea580c; font-weight: 600;">संपर्क प्रपत्र (/contact)</a> के माध्यम से संपर्क करें।</p>
          </section>
        </div>
      `
    },
    {
      route: 'disclaimer',
      title: 'अस्वीकरण (Disclaimer) | Aradhna Marg',
      description: 'आराधना मार्ग का विधिक अस्वीकरण।',
      h1: 'अस्वीकरण (Disclaimer)',
      content: 'इस वेबसाइट पर प्रस्तुत सभी धार्मिक सामग्री व भजन केवल भक्ति एवं ज्ञानवर्धन के उद्देश्य से हैं।'
    }
  ];

  for (const page of staticPages) {
    const canonicalUrl = page.canonicalUrl || (page.route === '' ? `${BASE_URL}/` : `${BASE_URL}/${page.route}`);

    let itemsHtml = '';
    if (page.items && page.items.length > 0) {
      itemsHtml = `<ul style="list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-top: 1.5rem;">
          ${page.items
            .map(
              (it) =>
                `<li style="background: #fff; padding: 1rem; border-radius: 8px; border: 1px solid #fed7aa;"><a href="${it.url}" style="color: #9a3412; font-weight: 600; text-decoration: none;">${escapeHtml(
                  it.title
                )}</a></li>`
            )
            .join('\n')}
        </ul>`;
    }

    let sectionsHtml = '';
    if (page.sections && page.sections.length > 0) {
      sectionsHtml = page.sections
        .map(
          (sec) => `
        <section style="margin-top: 2rem;">
          <h2 style="font-size: 1.4rem; font-weight: 700; color: #9a3412; margin-bottom: 0.75rem;"><a href="${sec.url}" style="color: #9a3412; text-decoration: none;">${escapeHtml(
            sec.title
          )} →</a></h2>
          <ul style="list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.75rem;">
            ${sec.items
              .map(
                (it) =>
                  `<li style="background: #fff; padding: 0.75rem 1rem; border-radius: 6px; border: 1px solid #fed7aa;"><a href="${it.url}" style="color: #334155; font-weight: 500; text-decoration: none;">${escapeHtml(
                    it.title
                  )}</a></li>`
              )
              .join('\n')}
          </ul>
        </section>`
        )
        .join('\n');
    }

    const bodyHtml = `
      <main class="aradhna-prerender-page" style="max-width: 1000px; margin: 0 auto; padding: 2rem 1.5rem; font-family: system-ui, -apple-system, sans-serif;">
        <header style="margin-bottom: 2rem;">
          ${page.route ? `<nav style="font-size: 0.9rem; margin-bottom: 1rem;"><a href="/" style="color: #ea580c; text-decoration: none;">मुख्य पृष्ठ</a> / <span>${escapeHtml(page.h1)}</span></nav>` : ''}
          <h1 style="font-size: 2rem; font-weight: 800; color: #1c1917; margin-bottom: 0.5rem;">${escapeHtml(page.h1)}</h1>
          <p style="color: #475569; font-size: 1.1rem; line-height: 1.6;">${escapeHtml(page.description)}</p>
        </header>
        ${page.contentHtml ? page.contentHtml : page.content ? `<div style="line-height: 1.8; color: #334155; margin-bottom: 1.5rem;">${escapeHtml(page.content)}</div>` : ''}
        ${sectionsHtml}
        ${itemsHtml}
      </main>
    `;

    // Structured data
    let schema = undefined;
    if (page.route === '') {
      // Home page WebSite + Organization schema
      schema = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': `${BASE_URL}/#website`,
            name: 'Aradhna Marg',
            alternateName: 'आराधना मार्ग',
            url: BASE_URL,
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: `${BASE_URL}/search?q={search_term_string}`
              },
              'query-input': 'required name=search_term_string'
            }
          },
          {
            '@type': 'Organization',
            '@id': `${BASE_URL}/#organization`,
            name: 'Aradhna Marg',
            alternateName: 'आराधना मार्ग',
            url: BASE_URL,
            logo: `${BASE_URL}/logo.png`,
            sameAs: ['https://www.youtube.com/@AradhnaMarg']
          }
        ]
      };
    } else if (!page.robots?.includes('noindex')) {
      schema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: page.title,
        description: page.description,
        url: canonicalUrl
      };
    }

    const html = buildHtml(baseTemplate, {
      route: page.route,
      title: page.title,
      description: page.description,
      canonicalUrl,
      robots: page.robots,
      schema,
      bodyHtml,
      initialData: page.route === '' ? homeData : null
    });

    writeRoute(page.route, html);
    count++;
  }

  // 2. Fetch Details and Prerender Bhajans
  console.log(`[Prerender] Fetching details for ${bhajans.length} bhajans...`);
  const bhajanDetails = await Promise.all(
    bhajans.map((b) => (b.slug ? fetchDetailFromApi(`/public/bhajans/${encodeURIComponent(b.slug)}`) : null))
  );

  for (let i = 0; i < bhajans.length; i++) {
    const b = bhajans[i];
    const detail = bhajanDetails[i] || b;
    const title = detail.hindi_title || detail.title || b.hindi_title || b.title;
    const slug = b.slug || b.id;
    if (!slug) continue;

    const pageTitle = `${title} - भजन के बोल | Aradhna Marg`;
    const canonicalUrl = `${BASE_URL}/bhajans/${encodeURIComponent(b.slug || b.id)}`;
    const desc =
      detail.short_description ||
      detail.description ||
      b.short_description ||
      `${title} के सम्पूर्ण पावन बोल, अर्थ और भावार्थ।`;
    const cleanDesc = stripHtml(desc).slice(0, 180);
    const lyrics = detail.lyrics || detail.clean_lyrics || detail.description || b.short_description || '';

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'MusicComposition',
      name: title,
      description: cleanDesc,
      url: canonicalUrl,
      inLanguage: 'hi'
    };

    const bodyHtml = `
      <article class="aradhna-prerender-bhajan" style="max-width: 850px; margin: 0 auto; padding: 2rem 1.5rem; font-family: system-ui, -apple-system, sans-serif;">
        <header style="margin-bottom: 2rem;">
          <nav style="font-size: 0.9rem; margin-bottom: 1rem;"><a href="/" style="color: #ea580c; text-decoration: none;">मुख्य पृष्ठ</a> / <a href="/bhajans" style="color: #ea580c; text-decoration: none;">भजन</a> / <span>${escapeHtml(title)}</span></nav>
          <h1 style="font-size: 2.2rem; font-weight: 800; color: #1c1917; margin-bottom: 0.5rem; line-height: 1.3;">${escapeHtml(title)}</h1>
          <p style="color: #475569; font-size: 1.1rem; line-height: 1.6;">${escapeHtml(cleanDesc)}</p>
        </header>
        <section style="background: #fffdfa; border: 1px solid #fed7aa; border-radius: 12px; padding: 2rem; margin-top: 2rem;">
          <h2 style="font-size: 1.3rem; font-weight: 700; color: #9a3412; margin-bottom: 1rem; border-bottom: 1px solid #fed7aa; padding-bottom: 0.5rem;">भजन के पावन बोल (Lyrics)</h2>
          <div style="line-height: 2; font-size: 1.15rem; color: #1c1917;">${formatDevotionalText(lyrics)}</div>
        </section>
        <footer style="margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
          <a href="/bhajans" style="color: #ea580c; font-weight: 600; text-decoration: none;">← समस्त भजन संग्रह देखें</a>
        </footer>
      </article>
    `;

    const html = buildHtml(baseTemplate, {
      route: `bhajans/${slug}`,
      title: pageTitle,
      description: cleanDesc,
      canonicalUrl,
      ogType: 'music.song',
      schema,
      bodyHtml,
      initialData: detail
    });

    writeRoute(`bhajans/${slug}`, html);
    count++;

    // Also prerender valid UUID if distinct from slug
    if (b.id && b.slug && b.id !== b.slug) {
      writeRoute(`bhajans/${b.id}`, html);
      count++;
    }
  }

  // 3. Fetch Details and Prerender Articles
  console.log(`[Prerender] Fetching details for ${articles.length} articles...`);
  const articleDetails = await Promise.all(
    articles.map((a) => (a.slug ? fetchDetailFromApi(`/public/articles/${encodeURIComponent(a.slug)}`) : null))
  );

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    const detail = articleDetails[i] || a;
    const title = detail.title || a.title;
    const slug = a.slug || a.id;
    if (!slug) continue;

    const pageTitle = detail.seo_title || `${title} | Aradhna Marg`;
    const canonicalUrl = `${BASE_URL}/articles/${encodeURIComponent(a.slug || a.id)}`;
    const desc =
      detail.seo_description ||
      detail.excerpt ||
      a.excerpt ||
      `${title} - सनातन धर्म, संस्कृति व भक्ति पर विस्तृत धार्मिक आलेख पढ़ें।`;
    const cleanDesc = stripHtml(desc).slice(0, 180);
    const content = detail.content || detail.displayContent || a.excerpt || '';
    const featuredImg = detail.featured_image_url || detail.image_url || `${BASE_URL}/logo.png`;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: cleanDesc,
      image: featuredImg,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl
      },
      author: {
        '@type': 'Organization',
        name: detail.author_name || 'Aradhna Marg',
        url: BASE_URL
      },
      publisher: {
        '@type': 'Organization',
        name: 'Aradhna Marg',
        logo: {
          '@type': 'ImageObject',
          url: `${BASE_URL}/logo.png`
        }
      },
      datePublished: detail.publish_date || detail.created_at,
      dateModified: detail.updated_at || detail.publish_date || detail.created_at,
      inLanguage: 'hi'
    };

    const bodyHtml = `
      <article class="aradhna-prerender-article" style="max-width: 850px; margin: 0 auto; padding: 2rem 1.5rem; font-family: system-ui, -apple-system, sans-serif;">
        <header style="margin-bottom: 2rem;">
          <nav style="font-size: 0.9rem; margin-bottom: 1rem;"><a href="/" style="color: #ea580c; text-decoration: none;">मुख्य पृष्ठ</a> / <a href="/articles" style="color: #ea580c; text-decoration: none;">लेख</a> / <span>${escapeHtml(title)}</span></nav>
          <h1 style="font-size: 2.2rem; font-weight: 800; color: #1c1917; margin-bottom: 0.5rem; line-height: 1.3;">${escapeHtml(title)}</h1>
          <p style="color: #475569; font-size: 1.1rem; line-height: 1.6;">${escapeHtml(cleanDesc)}</p>
        </header>
        <section style="line-height: 1.9; font-size: 1.1rem; color: #334155; margin-top: 2rem;">
          ${content}
        </section>
        <footer style="margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
          <a href="/articles" style="color: #ea580c; font-weight: 600; text-decoration: none;">← समस्त धार्मिक लेख देखें</a>
        </footer>
      </article>
    `;

    const html = buildHtml(baseTemplate, {
      route: `articles/${slug}`,
      title: pageTitle,
      description: cleanDesc,
      canonicalUrl,
      ogType: 'article',
      ogImage: featuredImg,
      schema,
      bodyHtml,
      initialData: detail
    });

    writeRoute(`articles/${slug}`, html);
    count++;

    // Also prerender valid UUID if distinct from slug
    if (a.id && a.slug && a.id !== a.slug) {
      writeRoute(`articles/${a.id}`, html);
      count++;
    }
  }

  // 4. Festivals Detail Pages
  console.log(`[Prerender] Prerendering ${festivals.length} festivals...`);
  for (const f of festivals) {
    const slug = f.slug || f.id;
    if (!slug) continue;
    const title = f.name;
    const pageTitle = `${title} - पूजन विधि एवं पौराणिक महत्व | Aradhna Marg`;
    const canonicalUrl = `${BASE_URL}/festivals/${encodeURIComponent(f.slug || f.id)}`;
    const desc = f.short_description || `${title} का पावन पर्व, शुभ मुहूर्त, पूजा विधि एवं धार्मिक महत्व।`;
    const cleanDesc = stripHtml(desc).slice(0, 180);

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: title,
      description: cleanDesc,
      url: canonicalUrl,
      ...(f.festival_date && { startDate: f.festival_date }),
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled'
    };

    const bodyHtml = `
      <article class="aradhna-prerender-festival" style="max-width: 850px; margin: 0 auto; padding: 2rem 1.5rem; font-family: system-ui, -apple-system, sans-serif;">
        <header style="margin-bottom: 2rem;">
          <nav style="font-size: 0.9rem; margin-bottom: 1rem;"><a href="/" style="color: #ea580c; text-decoration: none;">मुख्य पृष्ठ</a> / <a href="/festivals" style="color: #ea580c; text-decoration: none;">पर्व एवं व्रत</a> / <span>${escapeHtml(title)}</span></nav>
          <h1 style="font-size: 2.2rem; font-weight: 800; color: #1c1917; margin-bottom: 0.5rem; line-height: 1.3;">${escapeHtml(title)}</h1>
          <p style="color: #475569; font-size: 1.1rem; line-height: 1.6;">${escapeHtml(cleanDesc)}</p>
        </header>
        ${f.content ? `<section style="line-height: 1.9; font-size: 1.1rem; color: #334155; margin-top: 2rem;">${f.content}</section>` : ''}
        <footer style="margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
          <a href="/festivals" style="color: #ea580c; font-weight: 600; text-decoration: none;">← समस्त हिन्दू पर्व देखें</a>
        </footer>
      </article>
    `;

    const html = buildHtml(baseTemplate, {
      route: `festivals/${slug}`,
      title: pageTitle,
      description: cleanDesc,
      canonicalUrl,
      ogImage: f.banner_image,
      schema,
      bodyHtml,
      initialData: f
    });

    writeRoute(`festivals/${slug}`, html);
    count++;

    if (f.id && f.slug && f.id !== f.slug) {
      writeRoute(`festivals/${f.id}`, html);
      count++;
    }
  }

  // 5. Puranas Detail Pages
  console.log(`[Prerender] Prerendering ${puranas.length} puranas...`);
  for (const p of puranas) {
    const slug = p.slug || p.id;
    if (!slug) continue;
    const title = p.title;
    const pageTitle = p.seo_title || `${title} - कथा एवं सार | Aradhna Marg`;
    const canonicalUrl = `${BASE_URL}/puranas/${encodeURIComponent(p.slug || p.id)}`;
    const desc = p.seo_description || p.short_description || `${title} का पावन सार, कथाएं एवं आध्यात्मिक उपदेश।`;
    const cleanDesc = stripHtml(desc).slice(0, 180);

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: title,
      description: cleanDesc,
      url: canonicalUrl,
      inLanguage: 'hi'
    };

    // Full readable content for search engines and direct curl requests
    const fullContent = p.short_description || p.description_en || p.description || cleanDesc;

    const bodyHtml = `
      <article class="aradhna-prerender-puran" style="max-width: 850px; margin: 0 auto; padding: 2rem 1.5rem; font-family: system-ui, -apple-system, sans-serif;">
        <header style="margin-bottom: 2rem;">
          <nav style="font-size: 0.9rem; margin-bottom: 1rem;"><a href="/" style="color: #ea580c; text-decoration: none;">मुख्य पृष्ठ</a> / <a href="/puranas" style="color: #ea580c; text-decoration: none;">पुराण</a> / <span>${escapeHtml(title)}</span></nav>
          <h1 style="font-size: 2.2rem; font-weight: 800; color: #1c1917; margin-bottom: 0.5rem; line-height: 1.3;">${escapeHtml(title)}</h1>
          ${p.title_en && p.title_en !== title ? `<p style="color: #78716c; font-size: 1rem; margin-top: 0.25rem;">${escapeHtml(p.title_en)}</p>` : ''}
          <p style="color: #475569; font-size: 1.1rem; line-height: 1.6; margin-top: 0.75rem;">${escapeHtml(cleanDesc)}</p>
        </header>
        <section class="puran-content" style="line-height: 1.9; font-size: 1.1rem; color: #334155; margin-top: 2rem;">
          ${fullContent}
        </section>
        <footer style="margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
          <a href="/puranas" style="color: #ea580c; font-weight: 600; text-decoration: none;">← समस्त महापुराण देखें</a>
        </footer>
      </article>
    `;

    const html = buildHtml(baseTemplate, {
      route: `puranas/${slug}`,
      title: pageTitle,
      description: cleanDesc,
      canonicalUrl,
      ogImage: p.cover_image,
      schema,
      bodyHtml,
      initialData: p
    });

    writeRoute(`puranas/${slug}`, html);
    count++;
  }

  // 6. Deities Detail Pages (Canonical route: /gods/)
  console.log(`[Prerender] Prerendering ${deities.length} deities...`);
  for (const d of deities) {
    const slug = KNOWN_DEITY_SLUGS[d.id] || d.slug || d.id;
    if (!slug) continue;
    const title = d.name;
    const pageTitle = `${title} - स्वरूप, स्तोत्र एवं पावन महिमा | Aradhna Marg`;
    const canonicalUrl = `${BASE_URL}/gods/${encodeURIComponent(slug)}`;
    const desc = d.short_description || `${title} के समस्त पावन भजन, आरती, चालीसा, स्तोत्र एवं दिव्य कथाएं।`;
    const cleanDesc = stripHtml(desc).slice(0, 180);

    const relatedBhajans = bhajans.filter((b) => b.god_id === d.id).slice(0, 10);
    const relatedArticles = articles
      .filter((a) => a.god_id === d.id || (a.god_ids && a.god_ids.includes(d.id)))
      .slice(0, 6);

    const bodyHtml = `
      <article class="aradhna-prerender-deity" style="max-width: 850px; margin: 0 auto; padding: 2rem 1.5rem; font-family: system-ui, -apple-system, sans-serif;">
        <header style="margin-bottom: 2rem;">
          <nav style="font-size: 0.9rem; margin-bottom: 1rem;"><a href="/" style="color: #ea580c; text-decoration: none;">मुख्य पृष्ठ</a> / <a href="/gods" style="color: #ea580c; text-decoration: none;">देवी-देवता</a> / <span>${escapeHtml(title)}</span></nav>
          <h1 style="font-size: 2.2rem; font-weight: 800; color: #1c1917; margin-bottom: 0.5rem; line-height: 1.3;">${escapeHtml(title)}</h1>
          <p style="color: #475569; font-size: 1.1rem; line-height: 1.6;">${escapeHtml(cleanDesc)}</p>
        </header>

        ${
          relatedBhajans.length > 0
            ? `
          <section style="margin-top: 2.5rem;">
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #9a3412; margin-bottom: 1rem; border-bottom: 2px solid #fed7aa; padding-bottom: 0.5rem;">${escapeHtml(title)} के पावन भजन एवं स्तुति</h2>
            <ul style="list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
              ${relatedBhajans
                .map(
                  (b) => `
                <li style="background: #fff; padding: 1rem; border-radius: 8px; border: 1px solid #fed7aa; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                  <a href="/bhajans/${encodeURIComponent(b.slug || b.id)}" style="color: #1e293b; font-weight: 600; text-decoration: none; display: block; margin-bottom: 0.25rem;">${escapeHtml(b.hindi_title || b.title)}</a>
                  ${b.title_en ? `<span style="color: #64748b; font-size: 0.85rem; display: block;">${escapeHtml(b.title_en)}</span>` : ''}
                </li>
              `
                )
                .join('\n')}
            </ul>
          </section>
        `
            : ''
        }

        ${
          relatedArticles.length > 0
            ? `
          <section style="margin-top: 2.5rem;">
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #9a3412; margin-bottom: 1rem; border-bottom: 2px solid #fed7aa; padding-bottom: 0.5rem;">${escapeHtml(title)} की पावन गाथाएं एवं धार्मिक लेख</h2>
            <ul style="list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
              ${relatedArticles
                .map(
                  (a) => `
                <li style="background: #fff; padding: 1rem; border-radius: 8px; border: 1px solid #fed7aa; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                  <a href="/articles/${encodeURIComponent(a.slug || a.id)}" style="color: #1e293b; font-weight: 600; text-decoration: none; display: block; margin-bottom: 0.25rem;">${escapeHtml(a.title)}</a>
                  ${a.excerpt ? `<p style="color: #64748b; font-size: 0.85rem; margin-top: 0.25rem; line-height: 1.4;">${escapeHtml(stripHtml(a.excerpt).slice(0, 100))}...</p>` : ''}
                </li>
              `
                )
                .join('\n')}
            </ul>
          </section>
        `
            : ''
        }

        <footer style="margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
          <a href="/gods" style="color: #ea580c; font-weight: 600; text-decoration: none;">← समस्त देवी-देवता दर्शन देखें</a>
        </footer>
      </article>
    `;

    const html = buildHtml(baseTemplate, {
      route: `gods/${slug}`,
      title: pageTitle,
      description: cleanDesc,
      canonicalUrl,
      ogImage: d.image,
      bodyHtml
    });

    writeRoute(`gods/${slug}`, html);
    count++;
  }

  // 7. Categories Detail Pages (Enriched with Bhajans & Articles to eliminate Thin Content)
  console.log(`[Prerender] Prerendering ${categories.length} categories...`);
  for (const c of categories) {
    const slug = KNOWN_CATEGORY_SLUGS[c.id] || c.slug || c.id;
    if (!slug) continue;
    const title = c.name;
    const pageTitle = `${title} - भक्ति संग्रह | Aradhna Marg`;
    const canonicalUrl = `${BASE_URL}/categories/${encodeURIComponent(slug)}`;
    const desc = c.description || `${title} से संबंधित समस्त पावन भजन, आरती, चालीसा एवं धार्मिक सामग्री।`;
    const cleanDesc = stripHtml(desc).slice(0, 180);

    const catBhajans = bhajans
      .filter((b) => b.category_id === c.id || (b.category_ids && b.category_ids.includes(c.id)))
      .slice(0, 15);
    const catArticles = articles.filter((a) => a.category_id === c.id).slice(0, 10);

    const bodyHtml = `
      <article class="aradhna-prerender-category" style="max-width: 850px; margin: 0 auto; padding: 2rem 1.5rem; font-family: system-ui, -apple-system, sans-serif;">
        <header style="margin-bottom: 2rem;">
          <nav style="font-size: 0.9rem; margin-bottom: 1rem;"><a href="/" style="color: #ea580c; text-decoration: none;">मुख्य पृष्ठ</a> / <a href="/categories" style="color: #ea580c; text-decoration: none;">श्रेणियां</a> / <span>${escapeHtml(title)}</span></nav>
          <h1 style="font-size: 2.2rem; font-weight: 800; color: #1c1917; margin-bottom: 0.5rem; line-height: 1.3;">${escapeHtml(title)}</h1>
          <p style="color: #475569; font-size: 1.1rem; line-height: 1.6;">${escapeHtml(cleanDesc)}</p>
        </header>

        <section style="margin-top: 2.5rem;">
          <h2 style="font-size: 1.5rem; font-weight: 700; color: #9a3412; margin-bottom: 1rem; border-bottom: 2px solid #fed7aa; padding-bottom: 0.5rem;">पावन भजन एवं संकीर्तन संग्रह (Sacred Bhajans)</h2>
          ${
            catBhajans.length > 0
              ? `
            <ul style="list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
              ${catBhajans
                .map(
                  (b) => `
                <li style="background: #fff; padding: 1rem; border-radius: 8px; border: 1px solid #fed7aa; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                  <a href="/bhajans/${encodeURIComponent(b.slug || b.id)}" style="color: #1e293b; font-weight: 600; text-decoration: none; display: block; margin-bottom: 0.25rem;">${escapeHtml(b.hindi_title || b.title)}</a>
                  ${b.title_en ? `<span style="color: #64748b; font-size: 0.85rem; display: block;">${escapeHtml(b.title_en)}</span>` : ''}
                </li>
              `
                )
                .join('\n')}
            </ul>
          `
              : `<p style="color: #64748b; font-size: 0.95rem;">इस श्रेणी के अंतर्गत शीघ्र ही नवीन भजन जोड़े जा रहे हैं।</p>`
          }
        </section>

        ${
          catArticles.length > 0
            ? `
          <section style="margin-top: 2.5rem;">
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #9a3412; margin-bottom: 1rem; border-bottom: 2px solid #fed7aa; padding-bottom: 0.5rem;">धार्मिक लेख एवं पौराणिक कथाएं (Spiritual Articles)</h2>
            <ul style="list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
              ${catArticles
                .map(
                  (a) => `
                <li style="background: #fff; padding: 1rem; border-radius: 8px; border: 1px solid #fed7aa; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                  <a href="/articles/${encodeURIComponent(a.slug || a.id)}" style="color: #1e293b; font-weight: 600; text-decoration: none; display: block; margin-bottom: 0.25rem;">${escapeHtml(a.title)}</a>
                  ${a.excerpt ? `<p style="color: #64748b; font-size: 0.85rem; margin-top: 0.25rem; line-height: 1.4;">${escapeHtml(stripHtml(a.excerpt).slice(0, 100))}...</p>` : ''}
                </li>
              `
                )
                .join('\n')}
            </ul>
          </section>
        `
            : ''
        }

        <footer style="margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
          <a href="/categories" style="color: #ea580c; font-weight: 600; text-decoration: none;">← समस्त श्रेणियां देखें</a>
        </footer>
      </article>
    `;

    const html = buildHtml(baseTemplate, {
      route: `categories/${slug}`,
      title: pageTitle,
      description: cleanDesc,
      canonicalUrl,
      ogImage: c.image_url,
      bodyHtml
    });

    writeRoute(`categories/${slug}`, html);
    count++;
  }

  // 8. 404 Page (Dedicated non-indexable 404 response for Vercel)
  const notFoundHtml = baseTemplate
    .replace(
      /<title[^>]*>[\s\S]*?<\/title>/,
      '<title data-prerender="true" data-rh="true">४०४ - पृष्ठ उपलब्ध नहीं है | 404 Not Found</title>'
    )
    .replace(
      /<meta[^>]*name="description"[^>]*content="[^"]*"[^>]*\/?>/,
      '<meta data-prerender="true" data-rh="true" name="description" content="The requested page could not be found on Aradhna Marg." />'
    )
    .replace(
      /<meta[^>]*name="robots"[^>]*content="[^"]*"[^>]*\/?>/,
      '<meta data-prerender="true" data-rh="true" name="robots" content="noindex, nofollow" />'
    )
    .replace(
      /<meta[^>]*name="googlebot"[^>]*content="[^"]*"[^>]*\/?>/,
      '<meta data-prerender="true" data-rh="true" name="googlebot" content="noindex, nofollow" />'
    )
    .replace(/<link[^>]*rel="canonical"[^>]*href="[^"]*"[^>]*\/?>\s*/, '') // Omit canonical tag on 404
    .replace(/<script[^>]*id="ld-json-schema"[^>]*>[\s\S]*?<\/script>\s*/, '') // Omit structured data on 404
    .replace(
      /<div id="root">[\s\S]*?<\/div>(?=\s*(?:<script|<\/body>))/i,
      `<div id="root">
        <noscript>
          <main style="max-width: 600px; margin: 4rem auto; text-align: center; font-family: system-ui, -apple-system, sans-serif; padding: 2rem;">
            <h1 style="font-size: 3rem; color: #ea580c; margin-bottom: 1rem;">४०४</h1>
            <h2 style="font-size: 1.5rem; color: #1c1917; margin-bottom: 1rem;">पृष्ठ उपलब्ध नहीं है (Page Not Found)</h2>
            <p style="color: #64748b; margin-bottom: 2rem;">आप जिस लिंक पर पहुँचे हैं वह उपलब्ध नहीं है। कृपया मुख्य पृष्ठ पर लौटें।</p>
            <a href="/" style="display: inline-block; padding: 0.75rem 1.5rem; background: #ea580c; color: white; border-radius: 8px; font-weight: 600; text-decoration: none;">मुख्य पृष्ठ (Home)</a>
          </main>
        </noscript>
      </div>`
    );

  fs.writeFileSync(path.join(DIST_DIR, '404.html'), notFoundHtml, 'utf-8');
  console.log(`[Prerender] Generated 404.html with noindex, nofollow directive.`);

  console.log(`[Prerender] Successfully pre-rendered ${count} static public routes into dist/!`);
}

prerenderAll().catch((err) => {
  console.error('[Prerender] Fatal error during prerendering:', err);
  process.exit(1);
});
