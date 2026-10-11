# ADR 005: SEO Scope — Public Website Content vs. YouTube Media References

## Status
Accepted

## Context
Aradhna Marg includes both a comprehensive SEO Engine (for website indexing, sitemaps, structured data, and audit diagnostics) and a YouTube Sync automation system (to import videos from official channels/playlists).

A critical architectural pitfall emerged:
- If imported YouTube videos are treated as first-class website content entities during SEO audits and sitemap generation, thousands of imported video records would pollute website SEO audits, generate duplicate/thin content alerts, dilute search authority, and produce phantom sitemap entries with missing meta descriptions.

## Decision
1. **Separation of Concerns**:
   - **Website SEO Content**: Content entities that represent distinct, indexable public website pages:
     - Bhajans (`/bhajans/:slug`)
     - Articles (`/articles/:slug`)
     - Festivals (`/festivals/:slug`)
     - Puranas (`/puranas/:slug`)
     - Categories (`/categories/:slug`)
     - Deities (`/deities/:slug`) (where public profile pages exist)
   - **YouTube Video Records**: Media/content references stored in `youtube_videos`. They represent external video streams and metadata imported for playback enrichment.
2. **SEO Engine Scope**:
   - The SEO Engine audits, score calculations, sitemap builders, and missing metadata diagnostics apply **exclusively to Website SEO Content**.
   - YouTube imported records must **NEVER** be included in the primary website SEO audit or sitemap unless a specific video has been converted into or linked to a dedicated, published website Bhajan/Article page.
3. **Structured Data & OpenGraph**:
   - When a Bhajan or Article includes an associated `youtube_video_id`, the public page generates rich VideoObject schema and OpenGraph video tags embedded within the parent Bhajan/Article page.

## Consequences
- **Positive**: Clean, high-quality SEO audits focused on real website pages; prevents search engine penalties for thin automated video duplicate pages.
- **Negative**: YouTube sync records do not have their own standalone sitemap.
- **Rules for Future Agents**:
  - Never query `youtube_videos` directly in SEO audit tools or sitemap generators as indexable standalone pages.
  - Maintain the rule that YouTube videos are media references that enrich website content, not standalone website pages.
