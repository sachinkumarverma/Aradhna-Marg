# Aradhna Marg — Agent Instructions

> **Permanent Project Constitution for AI Agents, Developers, and Automated Tools**  
> **Repository:** `sachinkumarverma/Aradhna-Marg`  
> **Status:** Active & Enforced

---

## 1. Mission

Aradhna Marg (आराधना मार्ग) is a devotional Sanatan Dharma web platform providing verified, structured devotional content including Bhajans, Articles, Festivals, sacred Puranas, Deities, Categories, Authors, and YouTube devotional media.

The platform preserves the reverence, linguistic precision, and spiritual sanctity of Sanatan Dharma content while delivering a fast, responsive, SEO-optimized, bilingual (Hindi & English) digital experience.

---

## 2. Mandatory First Steps for Any Agent

Before suggesting code, running commands, or modifying files:

1. **Read this Constitution (`AGENTS.md`) in its entirety.**
2. **Review the Detailed Project Skill Documentation:** Check [.agents/skills/aradhna-marg/SKILL.md](.agents/skills/aradhna-marg/SKILL.md).
3. **Inspect the Architecture Decision Records (ADRs):**
   - [ADR 001: Public and Admin Host Separation](docs/architecture/001-public-admin-host-separation.md)
   - [ADR 002: Backend-Only Database Access](docs/architecture/002-backend-only-database-access.md)
   - [ADR 003: Direct Upload Workflow (No Media Library)](docs/architecture/003-direct-upload-no-media-library.md)
   - [ADR 004: Backblaze B2 S3-Compatible Storage](docs/architecture/004-backblaze-b2-object-storage.md)
   - [ADR 005: SEO Scope (Website vs YouTube)](docs/architecture/005-seo-scope-website-vs-youtube.md)
   - [ADR 006: Future Agentic AI Permission Boundaries](docs/architecture/006-future-agentic-ai-permission-boundaries.md)
4. **Inspect the Real Files First:** Never make assumptions about folder paths, database columns, or endpoints. Always use file inspection tools to verify actual code before proposing changes.
5. **Check Working Tree Status:** Verify clean state (`git status`) before starting any modifications.

---

## 3. Source of Truth & Governance Precedence

When evaluating project rules, architecture, and behavior, agents must strictly follow this authority hierarchy:

1. **`AGENTS.md` (Constitutional Law)**: Top-level governance, inviolable boundaries, and safety protocols.
2. **Architecture Decision Records (`ADRs`)**: Specific design decisions, rationale, and structural boundaries.
3. **`SKILL.md`**: Deep technical reference, folder structures, schemas, and workflows.
4. **Active Implementation**: Current source code in `frontend/`, `backend/`, and database migrations.

### Conflict Resolution Protocol

If the active implementation conflicts with `AGENTS.md`, an ADR, or `SKILL.md`:

- **DO NOT** silently change the implementation.
- **DO NOT** silently rewrite or weaken the documentation.
- **Identify and report** the discrepancy clearly to the user.
- **Continue only** if the user's explicit task authorizes reconciling that specific discrepancy.
- **Safety Rule**: Architectural boundaries, security controls, and safety rules must **never** be weakened simply because the current code does something different.

---

## 4. Public vs Admin Separation

Aradhna Marg separates public audience consumption from back-office management:

- **Public Production Host:** `https://aradhnamarg.com` (serves `frontend/src/user/`).
- **Admin Production Host:** `https://admin.aradhnamarg.com` (serves `frontend/src/admin/`).
- **Host Detection:** Evaluated in `frontend/src/utils/host.ts` via `isAdminHost()` and `isPublicHost()`.
- **Local Development Compatibility:** In local development (`localhost:5173`), both interfaces run concurrently:
  - Root `/` serves public routes.
  - `/admin/*` serves admin routes.
  - In production public site, any hit to `/admin` or `/admin/*` performs a client-side redirect (`LegacyAdminRedirect`) to `https://admin.aradhnamarg.com`.
- **Rule:** Never remove local development `/admin` compatibility. Never place admin management code inside `src/user/`.
- **Security Rule:** Host separation is a UX boundary, not a security boundary. All admin data and mutations are protected by backend JWT authentication.

---

## 5. Content Model & Relationships

1. **Bhajans (`bhajans`)**:
   - Key fields: `title`, `hindi_title`, `slug`, `lyrics` (Devanagari text), `clean_lyrics`, `description`, `short_description`, `youtube_video_id`, `pdf_url`, `category_id`, `god_id`, `festival_id`, `author_id`, `status` (`DRAFT`/`PUBLISHED`), SEO fields.
   - Junction tables: `bhajan_gods`, `bhajan_tags`.
   - **Crucial Rule:** Bhajan lyrics represent sacred poetic compositions and must **NEVER** be automatically translated to English.
2. **Articles (`articles`)**:
   - Bilingual support: Hindi original (`title`, `excerpt`, `content`) alongside English equivalents (`title_en`, `excerpt_en`, `content_en`, `seo_title_en`, `seo_description_en`).
   - Fields & relationships: `category_id`, `author_id`, `featured_image_id`, `status`, `featured`, `publish_date`.
   - Junction tables: `article_bhajans`, `article_festivals`, `article_gods`, `article_tags`, `related_articles`.
   - Tags Workflow: Inline custom tags added to an article do not create unapproved entries in the global master tags catalog.
3. **Festivals (`festivals`)**:
   - Fields: `name`, `name_en`, `slug`, `festival_date`, `end_date`, `short_description`, `short_description_en`, `banner_image`, `content`, `content_en`, `category`, `status`, `featured`, SEO fields.
   - Junction tables: `festival_articles`, `festival_bhajans`.
   - Status is handled case-insensitively and mapped cleanly in `FestivalRepository`.
4. **Puranas (`puranas`)**:
   - **Architecture Rule:** Puranas are represented through metadata, description, cover artwork, and PDF files. The full multi-thousand-page scriptural Sanskrit/Hindi text is **NOT** entered as raw rich text into the CMS.
   - Fields: `title`, `title_en`, `slug`, `short_description`, `description_en`, `cover_image`, `pdf_file`, `language`, `author`, `status`, `view_count`, `download_count`, `display_order`, SEO fields.
   - PDFs are stored in Backblaze B2 object storage via `BackblazeStorageService` and streamed/downloaded by users.
5. **Master Entities**:
   - **Deities (`deities` / `gods`)**: Master deities for categorization and cross-referencing. Note: newer CRUD uses `deities` table, while legacy schema column `god_id` links to `deities` in active repository queries. Public routing supports both `/gods` and `/deities`.
   - **Categories (`categories`)**: Hierarchical or primary classifications.
   - **Authors (`authors`)**: Content creators, translators, and contributors.
   - **Tags (`tags`)**: Master keyword taxonomies.

---

## 6. Backend & API Rules

1. **Strict 4-Layer Hierarchy:**
   `Frontend (apiClient) → Controller → Service → Repository → DatabaseClient`
2. **Hybrid Backend Layout:**
   - Layered modules in `backend/src/controllers/`, `services/`, `repositories/`.
   - Feature modules in `backend/src/features/` (`bhajans`, `deities`, `categories`, `tags`, `youtube`, `seo`, `translations`).
   - Admin-specific controllers & services in `backend/src/admin/`.
3. **Controllers:** Only unpack request bodies/parameters, call the appropriate Service method, and format the JSON HTTP response. No direct SQL or business logic.
4. **Services:** Enforce validations, business rules, duplicate slug resolution, audit logging, and coordinate multiple repositories.
5. **Repositories:** The **only** layer allowed to execute SQL queries. All queries must use parameterized placeholders (`$1, $2, ...`). Never concatenate user input into SQL strings.
6. **Responses:** Always return standardized JSON envelopes:
   `{ success: true, data: ... }` or `{ success: false, error: "Message" }`.

---

## 7. Database Access Rules & Deprecation

- **Zero Direct Database Access from Frontend:**
  Frontend code must **NEVER** query PostgreSQL/Supabase directly. The only permitted data-access flow is:
  ```
  Frontend
     ↓
  API Client (apiClient)
     ↓
  Backend Controller
     ↓
  Backend Service
     ↓
  Backend Repository
     ↓
  DatabaseClient / PostgreSQL
  ```
- **Explicit Deprecation of Legacy Frontend Client:**
  The file `frontend/src/lib/supabase.ts` is legacy/orphaned code and **MUST NOT** be imported, used, or resurrected by new development or autonomous agents.
- **Backend Native Pool:** Backend uses `pg.Pool` initialized in `backend/src/config/database.ts` via `DatabaseClient`.
- **Transactions:** Multi-table operations (e.g. updating an article and synchronizing relationship junction tables) must use explicit database transactions (`BEGIN`, `COMMIT`, `ROLLBACK`).

---

## 8. Storage & Upload Rules

- **Direct Upload Workflow ([ADR 003](docs/architecture/003-direct-upload-no-media-library.md)):**
  - The frontend Media Library browsing page was removed from navigation.
  - Image uploads are performed directly and contextually inside entity forms using `ImageUploadWithCrop` which posts to `POST /api/admin/media/files` via `uploadFile` (`frontend/src/api/upload.ts`).
  - Purana PDFs are uploaded directly via `POST /api/admin/puranas/upload-pdf` via `uploadPuranPdf`.
- **Backblaze B2 Object Storage ([ADR 004](docs/architecture/004-backblaze-b2-object-storage.md)):**
  - Purana PDFs are stored in Backblaze B2 using `@aws-sdk/client-s3` via `BackblazeStorageService` (`backend/src/services/storage/BackblazeStorageService.ts`).
  - Environment variables: `B2_ENDPOINT`, `B2_REGION`, `B2_ACCESS_KEY_ID`, `B2_SECRET_ACCESS_KEY`, `B2_BUCKET_NAME`.
- **Image Processing:** Image uploads are compressed to WebP and resized using `sharp` in `MediaService.ts`.
- **Zero Secrets in Code/Docs:** Never include B2 credentials, bucket keys, or tokens in source code, documentation, or commit messages.

---

## 9. Authentication & Security

- **Single-Tenant Stateless Admin Authentication:**
  - Authentication is single-tenant and validates credentials against environment variables `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
  - The login endpoint (`POST /api/admin/auth/login`) validates the submitted username and password against these environment values.
  - Successful authentication signs a JSON Web Token (JWT) valid for 24 hours using `JWT_SECRET`.
  - Token validity is verified in middleware (`requireAdmin`) via `jwt.verify(token, config.JWT_SECRET)`.
  - **No active database user lookup is performed.**
  - **No active sessions-table validation is performed.**
  - Authentication is currently **stateless**.
- **Session Expiry Handling:** Client-side 401 triggers `session-expired` event handled by `SessionManager.tsx`.
- **No Client Secrets:** Environment variables prefixed with `VITE_` are bundled into client JavaScript. Never place backend secrets or service-role keys in `VITE_` variables.

---

## 10. SEO Engine Rules

- **Scope ([ADR 005](docs/architecture/005-seo-scope-website-vs-youtube.md)):** SEO tools, score calculations, metadata audits, and sitemaps apply **strictly to indexable public website pages** (`bhajans`, `articles`, `festivals`, `puranas`, `categories`).
- **YouTube Records Are Not Website Pages:** Imported YouTube video records are media references and must **NOT** be included in website SEO audits or sitemap generators.
- **Fallbacks:** Public page SEO uses intelligent fallbacks: `seo_title` falls back to content title; `seo_description` falls back to excerpt or first 160 characters of clean content.
- **Structured Data:** Use schema.org JSON-LD (`Article`, `MusicComposition`, `Event`, `Book`, `VideoObject`) where applicable.

---

## 11. YouTube Sync Rules

- **Media Reference Model:** Synchronized YouTube records in `youtube_videos` are media references, not standalone website pages.
- **Permanent Ignore Rule:** When a video record is deleted from `youtube_videos`, future channel syncs may re-import it. To permanently prevent a video from re-importing, its `import_status` must be set to `IGNORED`.
- **Repository & Service:** Managed by `YoutubeVideoRepository` and `YoutubeSyncService` in `backend/src/features/youtube/`.
- **Linking:** YouTube videos can be linked to Bhajans or Articles via `youtube_video_id` or embedded manually.

---

## 12. AI Processing Rules

- **In-Process Worker Implementation:** Backed by `ai_jobs` table (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`).
  - `AiWorker` (`backend/src/admin/services/ai/AiWorker.ts`) runs an in-process periodic check (`setInterval` every 20 seconds) claiming pending jobs using `FOR UPDATE SKIP LOCKED`.
- **Action Types Supported:**
  - `GENERATE_MEANING` (Bhajans — updates meaning in Hindi without modifying sacred lyrics)
  - `GENERATE_SUMMARY` (Articles)
  - `IMPROVE_GRAMMAR` (Articles)
  - `GENERATE_SEO` (Content meta tags)
  - `IMPROVE_DESCRIPTION` (Festivals)
  - `GENERATE_SHORT_DESC` (Puranas)
  - `BULK_SEO`, `BULK_EXCERPT`, `BULK_FESTIVAL`
- **Content Integrity:** AI may generate devotional meanings, summaries, or SEO tags, but lyrics remain untouched.
- **Status Default:** All AI-generated content must default to `DRAFT` status and await human review.

---

## 13. UI/UX Rules

- **Visual Theme:** Devotional, spiritual aesthetic using warm saffrons, deep maroons/golds, clean slate backgrounds, and glassmorphic cards.
- **Component Reuse:** Always reuse existing shared components in `frontend/src/components/ui/` (`Button`, `Card`, `Badge`, `Modal`, `Input`, `Tabs`, `Table`, etc.).
- **No Arbitrary Frameworks:** Do not introduce third-party UI libraries (Material UI, Ant Design, Chakra UI). Rely on the existing Tailwind and custom component design system.
- **Drafts Management:** Content list screens (Articles, Bhajans, Festivals, Puranas) provide dedicated Draft filtering/tabs next to create actions. Maintain this pattern.

---

## 14. Language & Typography Rules

- **Bilingual Platform:** Hindi (Devanagari script) and English.
- **Hindi Typography:** Primary Devanagari font is **Anek Devanagari**.
- **Devanagari Alignment:** Pay strict attention to Hindi matras (vowel signs above and below letters) and ensure proper vertical alignment with icons and English labels.
- **Preserve Sacred Text:** Never alter sacred verses, Sanskrit shlokas, or stanzas for arbitrary whitespace formatting.

---

## 15. Settings Architecture

- **Modular Settings:** Platform settings are divided into discrete functional sections:
  1. `general`
  2. `contact`
  3. `social`
  4. `youtube`
  5. `seo`
  6. `analytics`
  7. `advertisement`
  8. `system`
- **Granular Updates:** Settings are saved independently per section via `/api/settings/:section` (e.g. `PUT /api/settings/general`).
- **Rule:** Never consolidate these into a single monolithic save payload or remove modular endpoints.

---

## 16. Deployment Rules

- **Production Targets:**
  - Public Website: `https://aradhnamarg.com`
  - Admin Portal: `https://admin.aradhnamarg.com`
- **Platform:** Vercel deployment with client-side SPA routing (`vercel.json` rewrites).
- **Zero DNS/Config Disruptions:** Do not alter production DNS, hosting records, or Vercel configurations without explicit user instruction.

---

## 17. Testing & Verification Rules

Before marking any task complete:

1. **Frontend Typecheck & Build:** Run `npm run build` in `frontend/` to verify zero TypeScript errors and clean bundling.
2. **Backend Typecheck & Build:** Run `npm run build` in `backend/` to verify zero TypeScript compilation issues.
3. **No Unintentional Diff:** Verify `git status` and `git diff` to ensure only requested files are modified.
4. **No Console Warnings:** Ensure newly introduced code does not trigger React key warnings, hook dependency errors, or unhandled promise rejections.

---

## 18. Future Agentic AI Permission Matrix

When Agentic AI is introduced, all AI workers and subagents must adhere to this permission tiering ([ADR 006](docs/architecture/006-future-agentic-ai-permission-boundaries.md)):

| Tier       | Operation                | Autonomous?                 | Description                                                                     |
| ---------- | ------------------------ | --------------------------- | ------------------------------------------------------------------------------- |
| **Tier 1** | **READ**                 | Allowed                     | Read public content, inspect schemas, check settings.                           |
| **Tier 2** | **ANALYZE**              | Allowed                     | Generate SEO audits, detect missing meta tags, scan broken links.               |
| **Tier 3** | **PROPOSE**              | Allowed                     | Generate draft articles, propose tags, format stanzas. Output saved as `DRAFT`. |
| **Tier 4** | **MODIFY DRAFT**         | Allowed (Logged)            | Edit existing `DRAFT` items. Cannot touch `PUBLISHED` content.                  |
| **Tier 5** | **PUBLISH / OVERWRITE**  | **HUMAN APPROVAL REQUIRED** | Moving `DRAFT` to `PUBLISHED`, updating live articles/bhajans.                  |
| **Tier 6** | **DELETE / DESTRUCTIVE** | **FORBIDDEN AUTONOMOUSLY**  | Deleting records, altering tables, truncating data, updating secrets.           |

---

## 19. Things Agents Must NEVER Do

Future autonomous agents and automated developers MUST NOT:

1. **NEVER** directly query PostgreSQL or Supabase from frontend code or React hooks.
2. **NEVER** import, use, or resurrect `frontend/src/lib/supabase.ts`.
3. **NEVER** bypass backend repositories, services, or controller layers.
4. **NEVER** invent database tables, models, or columns that do not exist in the active schema.
5. **NEVER** assume documented architecture is active if inspected code proves otherwise.
6. **NEVER** publish content without the required human-approval mechanism (Tier 5).
7. **NEVER** delete production content or execute destructive bulk mutations (Tier 6).
8. **NEVER** modify published content without explicit authorization.
9. **NEVER** modify sacred devotional lyrics or Sanskrit verses unless explicitly instructed.
10. **NEVER** automatically translate Bhajan lyrics into English.
11. **NEVER** include YouTube-imported records as standalone website pages in SEO audits or sitemaps.
12. **NEVER** recreate the removed centralized Media Library browsing view.
13. **NEVER** combine modular settings endpoints into a single global settings endpoint.
14. **NEVER** remove the local development `/admin` compatibility fallback.
15. **NEVER** commit secrets, API keys, passwords, or credentials into repository files.
16. **NEVER** execute unparameterized SQL queries in repositories.

---

## 20. Definition of Done

A task is complete only when:

- [ ] Source code accurately reflects the architectural principles outlined above.
- [ ] No regression is introduced to existing public or admin workflows.
- [ ] Both `frontend` and `backend` pass `npm run build` without compilation or lint errors.
- [ ] Any architectural gap or discrepancy is explicitly documented rather than masked.
- [ ] All modified or created files are properly linked and formatted.
