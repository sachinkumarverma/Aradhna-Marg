process.env.NODE_ENV = 'test';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { stripMarkdownAndHtml, formatSeoDescription } from '../utils/stripMarkdown';

describe('AdSense & Devotional SEO Readiness Audit', () => {
  describe('A & B. Markdown and HTML Stripping for SEO Metadata', () => {
    it('strips bold asterisks from devotional descriptions without losing text', () => {
      const raw = '**मुख्य भक्ति भाव** – श्री हनुमान जी की पावन स्तुति और संकट मोचन कृपा।';
      const clean = stripMarkdownAndHtml(raw);

      assert.equal(clean.includes('**'), false);
      assert.equal(clean.includes('मुख्य भक्ति भाव – श्री हनुमान जी की पावन स्तुति और संकट मोचन कृपा।'), true);
    });

    it('strips varied markdown markers: headers, bold, italics, code, strikethrough, blockquotes', () => {
      const raw = `
        ### पावन भजन सार
        यह भजन **भगवान श्री कृष्ण** की *मधुर लीलाओं* का वर्णन करता है।
        > 'राधे राधे' जपना परम कल्याणकारी है।
        इसमें \`सत्संग\` और [आरती](/bhajans) का महत्व भी बताया गया है।
        ![कृष्ण छवि](https://aradhnamarg.com/image.jpg)
        ~~पुराना विवरण~~
      `;
      const clean = stripMarkdownAndHtml(raw);

      assert.equal(clean.includes('###'), false);
      assert.equal(clean.includes('**'), false);
      assert.equal(clean.includes('*'), false);
      assert.equal(clean.includes('`'), false);
      assert.equal(clean.includes('>'), false);
      assert.equal(clean.includes('!['), false);
      assert.equal(clean.includes('~~'), false);
      assert.equal(clean.includes('भगवान श्री कृष्ण की मधुर लीलाओं का वर्णन करता है'), true);
      assert.equal(clean.includes('आरती का महत्व भी बताया गया है'), true);
    });

    it('strips HTML tags and decodes entities', () => {
      const raw = '<p>हनुमान चालीसा &amp; संकटमोचन पाठ&nbsp;<strong>(सम्पूर्ण)</strong></p>';
      const clean = stripMarkdownAndHtml(raw);

      assert.equal(clean.includes('<p>'), false);
      assert.equal(clean.includes('<strong>'), false);
      assert.equal(clean.includes('&nbsp;'), false);
      assert.equal(clean.includes('&amp;'), false);
      assert.equal(clean, 'हनुमान चालीसा & संकटमोचन पाठ (सम्पूर्ण)');
    });

    it('formats SEO descriptions to clean plain text under 160 characters with boundary trimming', () => {
      const longInput =
        '**हनुमान चालीसा** गोस्वामी तुलसीदास जी द्वारा रचित एक अत्यंत पावन और चमत्कारी स्तुति है। इसके नियमित पाठ से जीवन के समस्त भय, संकट, रोग और बाधाएं दूर होती हैं और साधक को ज्ञान, बुद्धि तथा अतुलित बल की प्राप्ति होती है।';
      const formatted = formatSeoDescription(longInput, 150);

      assert.ok(formatted.length <= 150, `Expected length <= 150, got ${formatted.length}`);
      assert.equal(formatted.includes('**'), false);
      assert.ok(formatted.endsWith('...') || /[.!?।॥]$/.test(formatted));
    });

    it('preserves complete natural sentences without cutting them off when within natural descriptive range', () => {
      const naturalSentence =
        '“वृंदावन सांचो धन भैया” श्री वृंदावन धाम की महिमा और ब्रज भूमि के प्रति प्रेम को समर्पित मधुर ब्रज भजन है। यह भजन वृंदावन को भक्त के जीवन का सच्चा धन और परम सौभाग्य मानते हुए श्री राधा-कृष्ण की पावन भक्ति का भाव प्रस्तुत करता है।';
      const result = formatSeoDescription(naturalSentence);

      assert.equal(
        result,
        naturalSentence,
        'Natural 200+ char complete sentences must be preserved without artificial truncation'
      );
      assert.equal(result.includes('...'), false);
    });

    it('ensures Hanuman Chalisa description example is clean plain text', () => {
      const sample = 'हनुमान चालीसा का शुद्ध पाठ, सरल हिंदी अर्थ, आध्यात्मिक संदेश और पाठ का महत्व।';
      const formatted = formatSeoDescription(sample, 160);

      assert.equal(formatted, sample);
      assert.equal(formatted.includes('**'), false);
      assert.ok(formatted.length >= 50 && formatted.length <= 160);
    });
  });

  describe('C. Trust & Transparency Pages (/about, /contact, /privacy, /terms)', () => {
    const frontendDir = path.resolve(__dirname, '../../../frontend');
    const aboutPagePath = path.join(frontendDir, 'src/user/pages/legal/AboutPage.tsx');

    it('AboutPage contains comprehensive mission, operator, and editorial sections', () => {
      assert.ok(fs.existsSync(aboutPagePath), 'AboutPage.tsx must exist');
      const content = fs.readFileSync(aboutPagePath, 'utf8');

      // 1. Mission
      assert.ok(content.includes('हमारा पावन उद्देश्य') || content.includes('Our Sacred Mission'));
      // 2. Who operates / maintains it
      assert.ok(content.includes('Aradhna Marg Editorial Team') || content.includes('सम्पादकीय दल'));
      assert.ok(content.includes('support@aradhnamarg.com'));
      assert.ok(content.includes('गांधीनगर') || content.includes('Gandhinagar'));
      // 3. Editorial & Scripture Review Process
      assert.ok(content.includes('सम्पादकीय प्रक्रिया') || content.includes('Editorial'));
      // 4. Corrections and Rights policy
      assert.ok(content.includes('संशोधन एवं अधिकार नीति') || content.includes('Corrections'));
    });

    it('Prerender script generates comprehensive static HTML for /about', () => {
      const prerenderScript = path.join(frontendDir, 'scripts/prerender-pages.mjs');
      assert.ok(fs.existsSync(prerenderScript), 'prerender-pages.mjs must exist');
      const content = fs.readFileSync(prerenderScript, 'utf8');

      assert.ok(content.includes("route: 'about'"));
      assert.ok(content.includes('contentHtml'));
      assert.ok(content.includes('Aradhna Marg Editorial Team'));
      assert.ok(content.includes('support@aradhnamarg.com'));
      assert.ok(content.includes('गांधीनगर, गुजरात'));
    });

    it('Legal and Trust pages are accessible and referenced in public footer', () => {
      const footerPath = path.join(frontendDir, 'src/components/common/Footer.tsx');
      assert.ok(fs.existsSync(footerPath), 'Footer.tsx must exist');
      const footerContent = fs.readFileSync(footerPath, 'utf8');

      assert.ok(footerContent.includes('/about'), 'Must link to /about');
      assert.ok(footerContent.includes('/privacy'), 'Must link to /privacy');
      assert.ok(footerContent.includes('/terms'), 'Must link to /terms');
      assert.ok(footerContent.includes('/disclaimer'), 'Must link to /disclaimer');
      assert.ok(footerContent.includes('/refund-policy'), 'Must link to /refund-policy');
    });
  });

  describe('D. AdSense Implementation & Verification', () => {
    const frontendDir = path.resolve(__dirname, '../../../frontend');
    const indexHtmlPath = path.join(frontendDir, 'index.html');
    const adsTxtPath = path.join(frontendDir, 'public/ads.txt');
    const adsenseUtilPath = path.join(frontendDir, 'src/utils/adsense.ts');
    const vercelJsonPath = path.join(frontendDir, 'vercel.json');

    const PUBLISHER_ID = 'ca-pub-8463841061449912';

    it('public ads.txt preserves the exact DIRECT publisher entry', () => {
      assert.ok(fs.existsSync(adsTxtPath), 'ads.txt must exist in frontend/public');
      const adsTxt = fs.readFileSync(adsTxtPath, 'utf8');

      assert.ok(adsTxt.includes('google.com, pub-8463841061449912, DIRECT, f08c47fec0942fa0'));
    });

    it('index.html renders the single AdSense script in head with correct publisher ID', () => {
      assert.ok(fs.existsSync(indexHtmlPath), 'index.html must exist');
      const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

      assert.ok(indexHtml.includes(`client=${PUBLISHER_ID}`));
      assert.ok(indexHtml.includes('google-adsense-script'));

      // Check occurrences of pagead2 in index.html - must only be 1 script tag
      const matches = indexHtml.match(/https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/g);
      assert.equal(matches?.length, 1, 'AdSense script must be included exactly once in index.html');
    });

    it('index.html pauses ad requests on policy-excluded and non-content pages', () => {
      const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

      assert.ok(indexHtml.includes('pauseAdRequests = 1'));
      assert.ok(indexHtml.includes('/privacy'));
      assert.ok(indexHtml.includes('/terms'));
      assert.ok(indexHtml.includes('/disclaimer'));
      assert.ok(indexHtml.includes('/refund-policy'));
      assert.ok(indexHtml.includes('/contact'));
      assert.ok(indexHtml.includes('/favorites'));
      assert.ok(indexHtml.includes('/admin'));
    });

    it('AdSense client loader has duplicate-load guard preventing double injection', () => {
      assert.ok(fs.existsSync(adsenseUtilPath), 'adsense.ts must exist');
      const adsenseUtil = fs.readFileSync(adsenseUtilPath, 'utf8');

      assert.ok(adsenseUtil.includes("document.getElementById('google-adsense-script')"));
      assert.ok(adsenseUtil.includes('script[src*="pagead2.googlesyndication.com"]'));
    });

    it('Content Security Policy allows required Google AdSense and DoubleClick domains', () => {
      assert.ok(fs.existsSync(vercelJsonPath), 'vercel.json must exist');
      const vercelJson = fs.readFileSync(vercelJsonPath, 'utf8');

      assert.ok(vercelJson.includes('https://pagead2.googlesyndication.com'));
      assert.ok(vercelJson.includes('https://tpc.googlesyndication.com'));
      assert.ok(vercelJson.includes('https://googleads.g.doubleclick.net'));
    });
  });

  describe('Static Build Artifact Audit (frontend/dist)', () => {
    const distDir = path.resolve(__dirname, '../../../frontend/dist');

    it('dist/ads.txt is present and matches the production ads.txt spec', () => {
      const distAdsTxt = path.join(distDir, 'ads.txt');
      if (!fs.existsSync(distAdsTxt)) {
        return; // Skip if dist has not been generated yet
      }
      const content = fs.readFileSync(distAdsTxt, 'utf8');
      assert.ok(content.includes('google.com, pub-8463841061449912, DIRECT, f08c47fec0942fa0'));
    });

    it('prerendered HTML files do not expose internal ai_generated_flag in serialized state', () => {
      const chalisaHtml = path.join(distDir, 'bhajans/hanuman-chalisa/index.html');
      if (!fs.existsSync(chalisaHtml)) {
        return;
      }
      const content = fs.readFileSync(chalisaHtml, 'utf8');
      assert.equal(content.includes('"ai_generated_flag": true'), false);
      assert.equal(content.includes('"search_vector"'), false);
    });

    it('prerendered HTML files have clean meta descriptions without raw markdown asterisks', () => {
      const chalisaHtml = path.join(distDir, 'bhajans/hanuman-chalisa/index.html');
      if (!fs.existsSync(chalisaHtml)) {
        return;
      }
      const content = fs.readFileSync(chalisaHtml, 'utf8');
      const metaMatch = content.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i);
      assert.ok(metaMatch, 'Must have meta description');
      const desc = metaMatch[1];
      assert.equal(desc.includes('**'), false, 'Meta description must not contain **');
      assert.equal(desc.includes('##'), false, 'Meta description must not contain ##');
    });

    it('prerendered /about page contains complete approved public content', () => {
      const aboutHtml = path.join(distDir, 'about/index.html');
      if (!fs.existsSync(aboutHtml)) {
        return;
      }
      const content = fs.readFileSync(aboutHtml, 'utf8');
      assert.ok(content.includes('हमारे बारे में (About Us)'));
      assert.ok(content.includes('Aradhna Marg Editorial Team') || content.includes('सम्पादकीय दल'));
      assert.ok(content.includes('support@aradhnamarg.com'));
      assert.ok(content.includes('1. हमारा पावन उद्देश्य'));
    });
  });
});
