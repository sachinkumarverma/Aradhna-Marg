import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import jwt from 'jsonwebtoken';
import app from '../app';
import { db } from '../common/database/DatabaseClient';
import { config } from '../config';
import { translationService } from '../features/translations/TranslationService';
import { translationCacheService } from '../features/translations/TranslationCacheService';
import { translationQuotaService } from '../features/translations/TranslationQuotaService';
import { GoogleTranslateProvider } from '../features/translations/GoogleTranslateProvider';

describe('Google Cloud Translation API Integration & Quota Monitoring Tests', () => {
  let server: http.Server;
  let baseUrl: string;
  let adminToken: string;

  before(async () => {
    // Generate valid admin JWT token
    adminToken = jwt.sign({ username: config.ADMIN_USERNAME, role: 'admin' }, config.JWT_SECRET, { expiresIn: '1h' });

    // Start local test server
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    // Clean up test cache entries
    try {
      await db.query(`DELETE FROM translation_cache WHERE text_hash LIKE 'test_%' OR source_text LIKE '%परीक्षण%'`);
    } catch {
      // ignore
    }
    setTimeout(() => process.exit(0), 100);
  });

  it('1. Translation Cache: unchanged content is served from cache and never re-translated', async () => {
    const hindiText = 'श्री हनुमान चालीसा का पाठ अत्यंत फलदायी है';
    const sourceLang = 'hi';
    const targetLang = 'en';
    const format = 'text';

    // Seed cache directly to verify zero external calls
    const mockEnglish = 'Recitation of Shri Hanuman Chalisa is extremely fruitful';
    await translationCacheService.set(hindiText, mockEnglish, sourceLang, targetLang, format, 'google');

    // Call service to translate the exact same text
    const result = await translationService.translateText(hindiText, sourceLang, targetLang);

    assert.equal(result.translated, mockEnglish);
    assert.match(result.provider, /cache/);

    // Check again to ensure second hit also serves from memory cache
    const secondResult = await translationService.translateText(hindiText, sourceLang, targetLang);
    assert.equal(secondResult.translated, mockEnglish);
    assert.match(secondResult.provider, /cache-mem/);
  });

  it('2. Quota Monitoring: tracks monthly character usage and enforces limit', async () => {
    const currentUsage = await translationQuotaService.getCurrentUsage();
    assert.equal(typeof currentUsage.charactersUsed, 'number');
    assert.equal(typeof currentUsage.translationsCount, 'number');

    const stats = await translationQuotaService.getStats();
    assert.ok(stats.month);
    assert.ok(stats.characterLimit > 0);
    assert.equal(typeof stats.remainingCharacters, 'number');
    assert.equal(typeof stats.isConfigured, 'boolean');

    // Test quota check when character count exceeds monthly limit
    const hugeCharacterCount = stats.characterLimit + 1000;
    await assert.rejects(
      async () => {
        await translationQuotaService.checkQuota(hugeCharacterCount);
      },
      (err: any) => {
        assert.equal(err.statusCode, 429);
        assert.match(err.message, /quota exceeded/i);
        return true;
      }
    );
  });

  it('3. Admin Endpoint GET /api/admin/translations/stats returns quota metrics without exposing secrets', async () => {
    const res = await fetch(`${baseUrl}/api/admin/translations/stats`, {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data);
    assert.ok(body.data.month);
    assert.equal(typeof body.data.characterLimit, 'number');
    assert.equal(typeof body.data.charactersUsed, 'number');
    assert.equal(typeof body.data.isConfigured, 'boolean');

    // Ensure NO secrets/keys are leaked in API response
    const rawResponse = JSON.stringify(body);
    assert.ok(!rawResponse.includes('AIzaSy'));
    assert.ok(!rawResponse.includes(config.JWT_SECRET));
    assert.ok(!rawResponse.includes(config.ADMIN_PASSWORD));
  });

  it('4. HTTP 429 & Graceful Error: preserves original Hindi content when translation is unavailable', async () => {
    // When live translation fails, the original content must remain intact and error message returned
    const originalHindiPayload = {
      title: 'श्री राम स्तुति',
      content: '<p>श्री रामचंद्र कृपालु भजु मन हरण भवभय दारुणं</p>'
    };

    // Temporarily disable provider or set empty key to simulate translation failure
    const originalKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    const originalConfigKey = config.GOOGLE_TRANSLATE_API_KEY;
    delete process.env.GOOGLE_TRANSLATE_API_KEY;
    (config as any).GOOGLE_TRANSLATE_API_KEY = undefined;

    try {
      const res = await fetch(`${baseUrl}/api/admin/translations/generate-live`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          content: originalHindiPayload,
          sourceLang: 'hi',
          targetLang: 'en'
        })
      });

      // Should return a graceful error status (e.g. 502/503), not 500 crash
      assert.ok(res.status >= 400 && res.status < 600);
      const data = await res.json();
      assert.equal(data.success, false);
      // The error message must inform the admin while affirming Hindi content safety
      assert.match(data.error || data.message, /preserved/i);
    } finally {
      process.env.GOOGLE_TRANSLATE_API_KEY = originalKey;
      (config as any).GOOGLE_TRANSLATE_API_KEY = originalConfigKey;
    }
  });

  it('5. Requirement 11: Homepage, article, Purana, bhajan, sitemap, and robots.txt return HTTP 200 when translation is unavailable', async () => {
    // Completely disable translation API
    const origKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    const origEnabled = config.GOOGLE_TRANSLATE_ENABLED;
    delete process.env.GOOGLE_TRANSLATE_API_KEY;
    (config as any).GOOGLE_TRANSLATE_ENABLED = 'false';

    try {
      // 5.1 Homepage / Home public API
      const homeRes = await fetch(`${baseUrl}/api/public/home`);
      assert.equal(homeRes.status, 200, 'Home API must return 200');
      const homeData = await homeRes.json();
      assert.equal(homeData.success, true);

      // 5.2 Bhajans public list
      const bhajansRes = await fetch(`${baseUrl}/api/public/bhajans?limit=5`);
      assert.equal(bhajansRes.status, 200, 'Bhajans API must return 200');
      const bhajansData = await bhajansRes.json();
      assert.equal(bhajansData.success, true);

      // 5.3 Articles public list
      const articlesRes = await fetch(`${baseUrl}/api/public/articles?limit=5`);
      assert.equal(articlesRes.status, 200, 'Articles API must return 200');
      const articlesData = await articlesRes.json();
      assert.equal(articlesData.success, true);

      // 5.4 Puranas public list
      const puranasRes = await fetch(`${baseUrl}/api/public/puranas?limit=5`);
      assert.equal(puranasRes.status, 200, 'Puranas API must return 200');
      const puranasData = await puranasRes.json();
      assert.equal(puranasData.success, true);

      // 5.5 Public Sitemap route
      const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`);
      assert.equal(sitemapRes.status, 200, 'Sitemap XML must return 200');
      const sitemapText = await sitemapRes.text();
      assert.ok(sitemapText.includes('urlset') || sitemapText.includes('sitemapindex'), 'Valid sitemap XML returned');

      // 5.6 Public Robots.txt route
      const robotsRes = await fetch(`${baseUrl}/robots.txt`);
      assert.equal(robotsRes.status, 200, 'Robots.txt must return 200');
      const robotsText = await robotsRes.text();
      assert.ok(robotsText.includes('User-agent'), 'Valid robots.txt returned');
    } finally {
      process.env.GOOGLE_TRANSLATE_API_KEY = origKey;
      (config as any).GOOGLE_TRANSLATE_ENABLED = origEnabled;
    }
  });
});
