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

async function fetchFromApi(endpoint) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`);
    if (!res.ok) {
      console.warn(`[Prerender] API ${endpoint} status: ${res.status}`);
      return [];
    }
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.warn(`[Prerender] Failed to fetch ${endpoint}:`, err.message);
    return [];
  }
}

async function fetchDetailFromApi(endpoint) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

function buildHtml(template, options) {
  let html = template;

  // Set html lang
  const lang = options.lang || 'hi';
  html = html.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);

  // Document Title
  const title = options.title ? `${options.title}` : 'आराधना मार्ग - भजनों, आरती, चालीसा, एवं पौराणिक कथाओं का पावन संग्रह';
  html = html.replace(/<title[^>]*>[\s\S]*?<\/title>/, `<title data-rh="true">${escapeHtml(title)}</title>`);

  // Meta Description
  const description = options.description ? escapeAttribute(options.description).slice(0, 200) : '';
  html = html.replace(
    /<meta[^>]*name="description"[^>]*content="[^"]*"[^>]*\/?>/,
    `<meta data-rh="true" name="description" content="${description}" />`
  );

  // Canonical URL - strictly one canonical tag
  const canonicalUrl = options.canonicalUrl || BASE_URL;
  html = html.replace(
    /<link[^>]*rel="canonical"[^>]*href="[^"]*"[^>]*\/?>/,
    `<link data-rh="true" rel="canonical" href="${canonicalUrl}" />`
  );

  // OG tags
  html = html.replace(
    /<meta[^>]*property="og:title"[^>]*content="[^"]*"[^>]*\/?>/,
    `<meta data-rh="true" property="og:title" content="${escapeAttribute(title)}" />`
  );
  html = html.replace(
    /<meta[^>]*property="og:description"[^>]*content="[^"]*"[^>]*\/?>/,
    `<meta data-rh="true" property="og:description" content="${description}" />`
  );
  html = html.replace(
    /<meta[^>]*property="og:url"[^>]*content="[^"]*"[^>]*\/?>/,
    `<meta data-rh="true" property="og:url" content="${canonicalUrl}" />`
  );
  if (options.ogType) {
    html = html.replace(
      /<meta[^>]*property="og:type"[^>]*content="[^"]*"[^>]*\/?>/,
      `<meta data-rh="true" property="og:type" content="${options.ogType}" />`
    );
  }
  if (options.ogImage) {
    const fullImage = options.ogImage.startsWith('http')
      ? options.ogImage
      : `${BASE_URL}${options.ogImage.startsWith('/') ? '' : '/'}${options.ogImage}`;
    html = html.replace(
      /<meta[^>]*property="og:image"[^>]*content="[^"]*"[^>]*\/?>/,
      `<meta data-rh="true" property="og:image" content="${escapeAttribute(fullImage)}" />`
    );
    html = html.replace(
      /<meta[^>]*name="twitter:image"[^>]*content="[^"]*"[^>]*\/?>/,
      `<meta data-rh="true" name="twitter:image" content="${escapeAttribute(fullImage)}" />`
    );
  }

  // Twitter title & desc
  html = html.replace(
    /<meta[^>]*name="twitter:title"[^>]*content="[^"]*"[^>]*\/?>/,
    `<meta data-rh="true" name="twitter:title" content="${escapeAttribute(title)}" />`
  );
  html = html.replace(
    /<meta[^>]*name="twitter:description"[^>]*content="[^"]*"[^>]*\/?>/,
    `<meta data-rh="true" name="twitter:description" content="${description}" />`
  );

  // Structured Data (JSON-LD)
  if (options.schema) {
    const schemaScript = `\n    <script data-rh="true" type="application/ld+json">\n${JSON.stringify(options.schema, null, 2)}\n    </script>`;
    html = html.replace(/<\/head>/, `${schemaScript}\n  </head>`);
  }

  // Initial Semantic Body Content inside <div id="root">
  if (options.bodyHtml) {
    html = html.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">\n${options.bodyHtml}\n    </div>`);
  }

  return html;
}

function writeRoute(routePath, htmlContent) {
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
  const [bhajans, articles, festivals, puranas, deities, categories] = await Promise.all([
    fetchFromApi('/public/bhajans?limit=100'),
    fetchFromApi('/public/articles?limit=100'),
    fetchFromApi('/public/festivals?limit=100'),
    fetchFromApi('/public/puranas?limit=100'),
    fetchFromApi('/public/deities'),
    fetchFromApi('/public/categories')
  ]);

  let count = 0;

  // 1. Static Listings
  const staticPages = [
    {
      route: 'bhajans',
      title: 'मधुर भजन संग्रह (Devotional Bhajans & Kirtans) | Aradhna Marg',
      description:
        'सनातन देवी-देवताओं के पावन एवं मधुर भजनों, आरतियों, चालीसा और स्तोत्रों का विशाल संग्रह। आनंद लें और प्रभु भक्ति में लीन हों।',
      h1: 'मधुर भजन संग्रह (Devotional Bhajans & Kirtans)',
      items: bhajans.map((b) => ({
        url: `/bhajans/${encodeURIComponent(b.slug)}`,
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
        url: `/articles/${encodeURIComponent(a.slug)}`,
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
        url: `/puranas/${encodeURIComponent(p.slug)}`,
        title: p.title
      }))
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
      description:
        'भजन, आरती, चालीसा, स्तोत्र, धार्मिक ग्रंथ एवं पौराणिक कथाओं की विषयवार श्रेणियां।',
      h1: 'भक्ति एवं आध्यात्मिक श्रेणियां (Categories)',
      items: categories.map((c) => ({
        url: `/categories/${encodeURIComponent(c.slug || c.id)}`,
        title: c.name
      }))
    },
    {
      route: 'about',
      title: 'हमारे बारे में (About Us) | Aradhna Marg',
      description:
        'आराधना मार्ग का उद्देश्य सनातन धर्म के पावन साहित्य, मधुर भजनों और पौराणिक ग्रंथों को जन-जन तक पहुंचाना है।',
      h1: 'हमारे बारे में (About Us)',
      content:
        'आराधना मार्ग (Aradhna Marg) सनातन धर्म और भक्ति साहित्य को समर्पित एक पावन डिजिटल मंच है।'
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
    const canonicalUrl = `${BASE_URL}/${page.route}`;
    const itemsHtml = page.items
      ? `<ul style="list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-top: 1.5rem;">
          ${page.items
            .map(
              (it) =>
                `<li style="background: #fff; padding: 1rem; border-radius: 8px; border: 1px solid #fed7aa;"><a href="${it.url}" style="color: #9a3412; font-weight: 600; text-decoration: none;">${escapeHtml(it.title)}</a></li>`
            )
            .join('\n')}
        </ul>`
      : '';

    const bodyHtml = `
      <main class="aradhna-prerender-page" style="max-width: 1000px; margin: 0 auto; padding: 2rem 1.5rem; font-family: system-ui, -apple-system, sans-serif;">
        <header style="margin-bottom: 2rem;">
          <nav style="font-size: 0.9rem; margin-bottom: 1rem;"><a href="/" style="color: #ea580c; text-decoration: none;">मुख्य पृष्ठ</a> / <span>${escapeHtml(page.h1)}</span></nav>
          <h1 style="font-size: 2rem; font-weight: 800; color: #1c1917; margin-bottom: 0.5rem;">${escapeHtml(page.h1)}</h1>
          <p style="color: #475569; font-size: 1.1rem; line-height: 1.6;">${escapeHtml(page.description)}</p>
        </header>
        ${page.content ? `<div style="line-height: 1.8; color: #334155;">${escapeHtml(page.content)}</div>` : ''}
        ${itemsHtml}
      </main>
    `;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: page.title,
      description: page.description,
      url: canonicalUrl
    };

    const html = buildHtml(baseTemplate, {
      route: page.route,
      title: page.title,
      description: page.description,
      canonicalUrl,
      schema,
      bodyHtml
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
    if (!b.slug) continue;
    const detail = bhajanDetails[i] || b;
    const title = detail.hindi_title || detail.title || b.hindi_title || b.title;
    const pageTitle = `${title} - भजन के बोल | Aradhna Marg`;
    const canonicalUrl = `${BASE_URL}/bhajans/${encodeURIComponent(b.slug)}`;
    const desc = detail.short_description || detail.description || b.short_description || `${title} के सम्पूर्ण पावन बोल, अर्थ और भावार्थ।`;
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
      route: `bhajans/${b.slug}`,
      title: pageTitle,
      description: cleanDesc,
      canonicalUrl,
      ogType: 'music.song',
      schema,
      bodyHtml
    });

    writeRoute(`bhajans/${b.slug}`, html);
    count++;
  }

  // 3. Fetch Details and Prerender Articles
  console.log(`[Prerender] Fetching details for ${articles.length} articles...`);
  const articleDetails = await Promise.all(
    articles.map((a) => (a.slug ? fetchDetailFromApi(`/public/articles/${encodeURIComponent(a.slug)}`) : null))
  );

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    if (!a.slug) continue;
    const detail = articleDetails[i] || a;
    const title = detail.title || a.title;
    const pageTitle = detail.seo_title || `${title} | Aradhna Marg`;
    const canonicalUrl = `${BASE_URL}/articles/${encodeURIComponent(a.slug)}`;
    const desc = detail.seo_description || detail.excerpt || a.excerpt || `${title} - सनातन धर्म, संस्कृति व भक्ति पर विस्तृत धार्मिक आलेख पढ़ें।`;
    const cleanDesc = stripHtml(desc).slice(0, 180);
    const content = detail.content || detail.displayContent || a.excerpt || '';

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: cleanDesc,
      url: canonicalUrl,
      datePublished: detail.publish_date || detail.created_at,
      dateModified: detail.updated_at || detail.created_at,
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
      route: `articles/${a.slug}`,
      title: pageTitle,
      description: cleanDesc,
      canonicalUrl,
      ogType: 'article',
      ogImage: detail.banner_image || detail.featured_image || a.featured_image_url,
      schema,
      bodyHtml
    });

    writeRoute(`articles/${a.slug}`, html);
    count++;
  }

  // 4. Fetch Details and Prerender Festivals
  console.log(`[Prerender] Fetching details for ${festivals.length} festivals...`);
  const festivalDetails = await Promise.all(
    festivals.map((f) => {
      const idOrSlug = f.slug || f.id;
      return idOrSlug ? fetchDetailFromApi(`/public/festivals/${encodeURIComponent(idOrSlug)}`) : null;
    })
  );

  for (let i = 0; i < festivals.length; i++) {
    const f = festivals[i];
    const slug = f.slug || f.id;
    if (!slug) continue;
    const detail = festivalDetails[i] || f;
    const title = detail.name || f.name;
    const pageTitle = detail.seo_title || `${title} - तिथि, कथा एवं पूजा विधि | Aradhna Marg`;
    const canonicalUrl = `${BASE_URL}/festivals/${encodeURIComponent(slug)}`;
    const desc = detail.seo_description || detail.short_description || f.short_description || `${title} की पावन कथा, शुभ मुहूर्त, पूजा विधि और महत्व।`;
    const cleanDesc = stripHtml(desc).slice(0, 180);
    const content = detail.content || detail.displayContent || detail.short_description || '';

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: title,
      description: cleanDesc,
      url: canonicalUrl,
      startDate: detail.festival_date || f.festival_date
    };

    const bodyHtml = `
      <article class="aradhna-prerender-festival" style="max-width: 850px; margin: 0 auto; padding: 2rem 1.5rem; font-family: system-ui, -apple-system, sans-serif;">
        <header style="margin-bottom: 2rem;">
          <nav style="font-size: 0.9rem; margin-bottom: 1rem;"><a href="/" style="color: #ea580c; text-decoration: none;">मुख्य पृष्ठ</a> / <a href="/festivals" style="color: #ea580c; text-decoration: none;">त्योहार</a> / <span>${escapeHtml(title)}</span></nav>
          <h1 style="font-size: 2.2rem; font-weight: 800; color: #1c1917; margin-bottom: 0.5rem; line-height: 1.3;">${escapeHtml(title)}</h1>
          ${f.festival_date ? `<p style="color: #ea580c; font-weight: 700; font-size: 1.05rem;">पर्व तिथि: ${escapeHtml(f.festival_date)}</p>` : ''}
          <p style="color: #475569; font-size: 1.1rem; line-height: 1.6;">${escapeHtml(cleanDesc)}</p>
        </header>
        ${content ? `<section style="line-height: 1.9; font-size: 1.1rem; color: #334155; margin-top: 2rem;">${content}</section>` : ''}
        <footer style="margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
          <a href="/festivals" style="color: #ea580c; font-weight: 600; text-decoration: none;">← समस्त सनातन पर्व देखें</a>
        </footer>
      </article>
    `;

    const html = buildHtml(baseTemplate, {
      route: `festivals/${slug}`,
      title: pageTitle,
      description: cleanDesc,
      canonicalUrl,
      ogType: 'website',
      ogImage: detail.banner_image || f.banner_image,
      schema,
      bodyHtml
    });

    writeRoute(`festivals/${slug}`, html);
    count++;
  }

  // 5. Fetch Details and Prerender Puranas
  console.log(`[Prerender] Fetching details for ${puranas.length} puranas...`);
  const puranDetails = await Promise.all(
    puranas.map((p) => (p.slug ? fetchDetailFromApi(`/public/puranas/${encodeURIComponent(p.slug)}`) : null))
  );

  for (let i = 0; i < puranas.length; i++) {
    const p = puranas[i];
    if (!p.slug) continue;
    const detail = puranDetails[i] || p;
    const title = detail.title || p.title;
    const pageTitle = `${title} - कथा, सार एवं परिचय | Aradhna Marg`;
    const canonicalUrl = `${BASE_URL}/puranas/${encodeURIComponent(p.slug)}`;
    const desc = detail.short_description || detail.description || p.short_description || `${title} का प्रामाणिक परिचय, अध्याय, श्लोक संख्या व महत्व।`;
    const cleanDesc = stripHtml(desc).slice(0, 180);
    const descriptionText = detail.description || detail.short_description || '';

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: title,
      description: cleanDesc,
      url: canonicalUrl,
      inLanguage: 'hi'
    };

    const bodyHtml = `
      <article class="aradhna-prerender-purana" style="max-width: 850px; margin: 0 auto; padding: 2rem 1.5rem; font-family: system-ui, -apple-system, sans-serif;">
        <header style="margin-bottom: 2rem;">
          <nav style="font-size: 0.9rem; margin-bottom: 1rem;"><a href="/" style="color: #ea580c; text-decoration: none;">मुख्य पृष्ठ</a> / <a href="/puranas" style="color: #ea580c; text-decoration: none;">महापुराण</a> / <span>${escapeHtml(title)}</span></nav>
          <h1 style="font-size: 2.2rem; font-weight: 800; color: #1c1917; margin-bottom: 0.5rem; line-height: 1.3;">${escapeHtml(title)}</h1>
          <p style="color: #475569; font-size: 1.1rem; line-height: 1.6;">${escapeHtml(cleanDesc)}</p>
        </header>
        ${descriptionText ? `<section style="line-height: 1.9; font-size: 1.1rem; color: #334155; margin-top: 2rem;">${formatDevotionalText(descriptionText)}</section>` : ''}
        <footer style="margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
          <a href="/puranas" style="color: #ea580c; font-weight: 600; text-decoration: none;">← समस्त अष्टादश महापुराण देखें</a>
        </footer>
      </article>
    `;

    const html = buildHtml(baseTemplate, {
      route: `puranas/${p.slug}`,
      title: pageTitle,
      description: cleanDesc,
      canonicalUrl,
      ogType: 'book',
      ogImage: detail.cover_image || p.cover_image,
      schema,
      bodyHtml
    });

    writeRoute(`puranas/${p.slug}`, html);
    count++;
  }

  // 6. Deities / Gods Detail Pages
  for (const d of deities) {
    const slug = d.slug || d.id;
    if (!slug) continue;
    const title = d.name;
    const pageTitle = `${title} - स्वरूप, मंत्र एवं महिमा | Aradhna Marg`;
    const canonicalUrl = `${BASE_URL}/gods/${encodeURIComponent(slug)}`;
    const desc = d.short_description || `${title} के समस्त पावन भजन, आरती, चालीसा, स्तोत्र एवं धार्मिक कथाएं।`;
    const cleanDesc = stripHtml(desc).slice(0, 180);

    const bodyHtml = `
      <article class="aradhna-prerender-deity" style="max-width: 850px; margin: 0 auto; padding: 2rem 1.5rem; font-family: system-ui, -apple-system, sans-serif;">
        <header style="margin-bottom: 2rem;">
          <nav style="font-size: 0.9rem; margin-bottom: 1rem;"><a href="/" style="color: #ea580c; text-decoration: none;">मुख्य पृष्ठ</a> / <a href="/gods" style="color: #ea580c; text-decoration: none;">देवी-देवता</a> / <span>${escapeHtml(title)}</span></nav>
          <h1 style="font-size: 2.2rem; font-weight: 800; color: #1c1917; margin-bottom: 0.5rem; line-height: 1.3;">${escapeHtml(title)}</h1>
          <p style="color: #475569; font-size: 1.1rem; line-height: 1.6;">${escapeHtml(cleanDesc)}</p>
        </header>
        <footer style="margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
          <a href="/gods" style="color: #ea580c; font-weight: 600; text-decoration: none;">← समस्त देवी-देवता दर्शन</a>
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
  }

  // 7. Categories Detail Pages
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
  }

  // 8. 404 Page (Dedicated non-indexable 404 response)
  const notFoundHtml = baseTemplate
    .replace(/<title[^>]*>[\s\S]*?<\/title>/, '<title data-rh="true">४०४ - पृष्ठ उपलब्ध नहीं है | 404 Not Found</title>')
    .replace(
      /<meta[^>]*name="description"[^>]*content="[^"]*"[^>]*\/?>/,
      '<meta data-rh="true" name="description" content="The requested page could not be found on Aradhna Marg." />'
    )
    .replace(
      /<meta[^>]*name="robots"[^>]*content="[^"]*"[^>]*\/?>/,
      '<meta name="robots" content="noindex, nofollow" />'
    )
    .replace(
      /<meta[^>]*name="googlebot"[^>]*content="[^"]*"[^>]*\/?>/,
      '<meta name="googlebot" content="noindex, nofollow" />'
    )
    .replace(/<link[^>]*rel="canonical"[^>]*href="[^"]*"[^>]*\/?>/, '') // Omit canonical tag on 404
    .replace(
      /<div id="root">[\s\S]*?<\/div>/,
      `<div id="root">
        <main style="max-width: 600px; margin: 4rem auto; text-align: center; font-family: system-ui, -apple-system, sans-serif; padding: 2rem;">
          <h1 style="font-size: 3rem; color: #ea580c; margin-bottom: 1rem;">४०४</h1>
          <h2 style="font-size: 1.5rem; color: #1c1917; margin-bottom: 1rem;">पृष्ठ उपलब्ध नहीं है (Page Not Found)</h2>
          <p style="color: #64748b; margin-bottom: 2rem;">आप जिस लिंक पर पहुँचे हैं वह उपलब्ध नहीं है। कृपया मुख्य पृष्ठ पर लौटें।</p>
          <a href="/" style="display: inline-block; padding: 0.75rem 1.5rem; background: #ea580c; color: white; border-radius: 8px; font-weight: 600; text-decoration: none;">मुख्य पृष्ठ (Home)</a>
        </main>
      </div>`
    );

  fs.writeFileSync(path.join(DIST_DIR, '404.html'), notFoundHtml, 'utf-8');
  console.log(`[Prerender] Generated 404.html with noindex directive.`);

  console.log(`[Prerender] Successfully pre-rendered ${count} static public routes into dist/!`);
}

prerenderAll().catch((err) => {
  console.error('[Prerender] Fatal error during prerendering:', err);
  process.exit(1);
});
