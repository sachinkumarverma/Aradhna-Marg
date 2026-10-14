import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.VITE_SITE_URL || 'https://aradhnamarg.com';
const DIST_DIR = path.resolve(__dirname, '../dist');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');
const API_URL = process.env.VITE_API_URL || process.env.API_URL || 'https://aradhna-marg.onrender.com/api/v1';

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
  // Wrapped in <noscript> so visitors with JavaScript enabled see the smooth loading spinner
  // without flash of unstyled content, while search engine crawlers index the semantic text and internal links.
  if (options.bodyHtml) {
    const loadingSpinnerHtml = `
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #F9F7F3; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div style="width: 44px; height: 44px; border: 3px solid #ffedd5; border-radius: 50%; box-sizing: border-box;"></div>
          <div style="position: absolute; width: 44px; height: 44px; border: 3px solid transparent; border-top-color: #ea580c; border-right-color: #ea580c; border-radius: 50%; animation: aradhna-spin 0.8s linear infinite; box-sizing: border-box;"></div>
          <div style="position: absolute; width: 8px; height: 8px; background-color: #ea580c; border-radius: 50%;"></div>
        </div>
        <style>
          @keyframes aradhna-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        </style>
      </div>`;

    html = html.replace(
      /<div id="root">[\s\S]*?<\/div>(?=\s*(?:<script|<\/body>))/i,
      `<div id="root">\n      <noscript>\n${options.bodyHtml}\n      </noscript>${loadingSpinnerHtml}\n    </div>`
    );
  }
  if (options.initialData) {
    const dataScript = `<script id="__PRERENDERED_DATA__" type="application/json">\n${JSON.stringify(
      options.initialData
    ).replace(/</g, '\\u003c')}\n</script>\n`;
    html = html.replace('</head>', `${dataScript}</head>`);
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
    fetchFromApi('/public/bhajans?limit=100'),
    fetchFromApi('/public/articles?limit=100'),
    fetchFromApi('/public/festivals?limit=100'),
    fetchFromApi('/public/puranas?limit=100'),
    fetchFromApi('/public/deities'),
    fetchFromApi('/public/categories'),
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
      items: deities.map((d) => ({
        url: `/gods/${encodeURIComponent(d.slug || d.id)}`,
        title: d.name
      }))
    },
    {
      route: 'deities',
      title: 'सनातन देवी-देवता दर्शन एवं महिमा (Divine Deities) | Aradhna Marg',
      description:
        'सनातन धर्म के आराध्य देवी-देवताओं के स्वरूप, स्तोत्र, मंत्र और दिव्य कथाओं का सम्पूर्ण आध्यात्मिक संग्रह।',
      h1: 'सनातन देवी-देवता दर्शन एवं महिमा (Divine Deities)',
      items: deities.map((d) => ({
        url: `/gods/${encodeURIComponent(d.slug || d.id)}`,
        title: d.name
      }))
    },
    {
      route: 'categories',
      title: 'भक्ति एवं आध्यात्मिक श्रेणियां (Categories) | Aradhna Marg',
      description: 'भजन, आरती, चालीसा, स्तोत्र, धार्मिक ग्रंथ एवं पौराणिक कथाओं की विषयवार श्रेणियां।',
      h1: 'भक्ति एवं आध्यात्मिक श्रेणियां (Categories)',
      items: categories.map((c) => ({
        url: `/categories/${encodeURIComponent(c.slug || c.id)}`,
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
      title: 'गोपनीयता नीति (Privacy Policy) | Aradhna Marg',
      description: 'आराधना मार्ग की गोपनीयता नीति एवं डेटा सुरक्षा जानकारी।',
      h1: 'गोपनीयता नीति (Privacy Policy)',
      content: 'हम आपकी गोपनीयता का पूर्ण सम्मान करते हैं और आपकी व्यक्तिगत जानकारी को सुरक्षित रखते हैं।'
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
        ${page.content ? `<div style="line-height: 1.8; color: #334155; margin-bottom: 1.5rem;">${escapeHtml(page.content)}</div>` : ''}
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
    const pageTitle = `${title} - कथा एवं सार | Aradhna Marg`;
    const canonicalUrl = `${BASE_URL}/puranas/${encodeURIComponent(p.slug || p.id)}`;
    const desc = p.short_description || `${title} का पावन सार, कथाएं एवं आध्यात्मिक उपदेश।`;
    const cleanDesc = stripHtml(desc).slice(0, 180);

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: title,
      description: cleanDesc,
      url: canonicalUrl,
      inLanguage: 'hi'
    };

    const bodyHtml = `
      <article class="aradhna-prerender-puran" style="max-width: 850px; margin: 0 auto; padding: 2rem 1.5rem; font-family: system-ui, -apple-system, sans-serif;">
        <header style="margin-bottom: 2rem;">
          <nav style="font-size: 0.9rem; margin-bottom: 1rem;"><a href="/" style="color: #ea580c; text-decoration: none;">मुख्य पृष्ठ</a> / <a href="/puranas" style="color: #ea580c; text-decoration: none;">पुराण</a> / <span>${escapeHtml(title)}</span></nav>
          <h1 style="font-size: 2.2rem; font-weight: 800; color: #1c1917; margin-bottom: 0.5rem; line-height: 1.3;">${escapeHtml(title)}</h1>
          <p style="color: #475569; font-size: 1.1rem; line-height: 1.6;">${escapeHtml(cleanDesc)}</p>
        </header>
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
      bodyHtml
    });

    writeRoute(`puranas/${slug}`, html);
    count++;

    if (p.id && p.slug && p.id !== p.slug) {
      writeRoute(`puranas/${p.id}`, html);
      count++;
    }
  }

  // 6. Deities Detail Pages (Support both /gods/ and /deities/)
  console.log(`[Prerender] Prerendering ${deities.length} deities...`);
  for (const d of deities) {
    const slug = d.slug || d.id;
    if (!slug) continue;
    const title = d.name;
    const pageTitle = `${title} - स्वरूप, स्तोत्र एवं पावन महिमा | Aradhna Marg`;
    const canonicalUrl = `${BASE_URL}/gods/${encodeURIComponent(slug)}`;
    const desc = d.short_description || `${title} के समस्त पावन भजन, आरती, चालीसा, स्तोत्र एवं दिव्य कथाएं।`;
    const cleanDesc = stripHtml(desc).slice(0, 180);

    const bodyHtml = `
      <article class="aradhna-prerender-deity" style="max-width: 850px; margin: 0 auto; padding: 2rem 1.5rem; font-family: system-ui, -apple-system, sans-serif;">
        <header style="margin-bottom: 2rem;">
          <nav style="font-size: 0.9rem; margin-bottom: 1rem;"><a href="/" style="color: #ea580c; text-decoration: none;">मुख्य पृष्ठ</a> / <a href="/gods" style="color: #ea580c; text-decoration: none;">देवी-देवता</a> / <span>${escapeHtml(title)}</span></nav>
          <h1 style="font-size: 2.2rem; font-weight: 800; color: #1c1917; margin-bottom: 0.5rem; line-height: 1.3;">${escapeHtml(title)}</h1>
          <p style="color: #475569; font-size: 1.1rem; line-height: 1.6;">${escapeHtml(cleanDesc)}</p>
        </header>
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
    writeRoute(`deities/${slug}`, html);
    count += 2;

    if (d.id && d.slug && d.id !== d.slug) {
      writeRoute(`gods/${d.id}`, html);
      writeRoute(`deities/${d.id}`, html);
      count += 2;
    }
  }

  // 7. Categories Detail Pages
  console.log(`[Prerender] Prerendering ${categories.length} categories...`);
  for (const c of categories) {
    const slug = c.slug || c.id;
    if (!slug) continue;
    const title = c.name;
    const pageTitle = `${title} - भक्ति संग्रह | Aradhna Marg`;
    const canonicalUrl = `${BASE_URL}/categories/${encodeURIComponent(slug)}`;
    const desc = c.description || `${title} से संबंधित समस्त पावन भजन, आरती, चालीसा एवं धार्मिक सामग्री।`;
    const cleanDesc = stripHtml(desc).slice(0, 180);

    const bodyHtml = `
      <article class="aradhna-prerender-category" style="max-width: 850px; margin: 0 auto; padding: 2rem 1.5rem; font-family: system-ui, -apple-system, sans-serif;">
        <header style="margin-bottom: 2rem;">
          <nav style="font-size: 0.9rem; margin-bottom: 1rem;"><a href="/" style="color: #ea580c; text-decoration: none;">मुख्य पृष्ठ</a> / <a href="/categories" style="color: #ea580c; text-decoration: none;">श्रेणियां</a> / <span>${escapeHtml(title)}</span></nav>
          <h1 style="font-size: 2.2rem; font-weight: 800; color: #1c1917; margin-bottom: 0.5rem; line-height: 1.3;">${escapeHtml(title)}</h1>
          <p style="color: #475569; font-size: 1.1rem; line-height: 1.6;">${escapeHtml(cleanDesc)}</p>
        </header>
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

    if (c.id && c.slug && c.id !== c.slug) {
      writeRoute(`categories/${c.id}`, html);
      count++;
    }
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
