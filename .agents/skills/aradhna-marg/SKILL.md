---
name: aradhna-marg
description: Deep architectural guide, content workflows, and development guidelines for the Aradhna Marg devotional Sanatan Dharma web platform.
---

# Aradhna Marg — Project Skill & Technical Reference

This skill documentation provides an exhaustive, authoritative reference for developers, Codex agents, Cursor agents, and autonomous AI agents working within the **Aradhna Marg** repository.

---

## 1. Project Overview

Aradhna Marg (आराधना मार्ग) is a full-stack devotional content platform dedicated to Sanatan Dharma. It provides structured, authoritative devotional material including:
- **Bhajans (भजन)**: Lyrics in Devanagari, meaning, video links, deity associations, and PDF downloads.
- **Articles (लेख)**: Bilingual spiritual essays, philosophy, scriptural commentary, and stories.
- **Festivals (त्यौहार)**: Hindu calendar dates, spiritual significance, rituals, and associated bhajans/articles.
- **Puranas (पुराण)**: Sacred texts presented with authentic cover artwork, descriptions, and downloadable full-length PDFs.
- **Deities (देवी-देवता)**: Master entities for spiritual classification and interconnected content graphs.
- **Categories, Authors, and Tags**: Rich taxonomies enabling search and contextual recommendations.
- **YouTube Media Integration**: Synchronized devotional video media references.
- **SEO & Automation**: In-depth SEO auditing, schema markup generation, and AI-assisted drafts.

---

## 2. Repository Structure

The repository is structured as a TypeScript monorepo with distinct frontend and backend boundaries:

```
AradhnaMarg/
├── AGENTS.md                                # Repository Constitution & Top-Level Rules
├── .agents/
│   └── skills/
│       └── aradhna-marg/
│           └── SKILL.md                     # This Technical Reference
├── docs/
│   └── architecture/                        # Architectural Decision Records (ADRs)
│       ├── 001-public-admin-host-separation.md
│       ├── 002-backend-only-database-access.md
│       ├── 003-direct-upload-no-media-library.md
│       ├── 004-backblaze-b2-object-storage.md
│       ├── 005-seo-scope-website-vs-youtube.md
│       └── 006-future-agentic-ai-permission-boundaries.md
├── frontend/                                # Vite + React 18 + TypeScript Application
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── src/
│       ├── admin/                           # ADMIN-ONLY APPLICATION
│       │   ├── components/                  # Admin UI (SessionManager, Sidebar, Header, etc.)
│       │   ├── features/                    # Feature widgets & dashboards
│       │   ├── layouts/                     # AdminLayout, AuthLayout
│       │   ├── pages/                       # Admin screens:
│       │   │   ├── dashboard/
│       │   │   ├── bhajans/                 # List, create, edit, draft views
│       │   │   ├── articles/                # Bilingual editor, related items, draft views
│       │   │   ├── festivals/               # Calendar date pickers, drafts
│       │   │   ├── puranas/                 # PDF uploads, metadata, drafts
│       │   │   ├── categories/              # Category CRUD
│       │   │   ├── deities/                 # Deity CRUD
│       │   │   ├── authors/                 # Author CRUD
│       │   │   ├── tags/                    # Master tags CRUD
│       │   │   ├── youtube/                 # Sync triggers, channel/playlist imports
│       │   │   ├── ai/                      # AI Jobs, prompt queues, logs
│       │   │   ├── seo/                     # Audits, missing metadata, bulk editor
│       │   │   ├── advertisements/          # Ad placement configs
│       │   │   ├── settings/                # 8 independent settings tabs
│       │   │   └── system-health/           # System health & connection diagnostics
│       │   └── routes/                      # AdminRoutes (/dashboard, /bhajans, etc.)
│       ├── user/                            # PUBLIC-ONLY APPLICATION
│       │   ├── components/                  # Public cards, navigation, hero, footer
│       │   ├── layouts/                     # PublicLayout (spiritual theme, navigation)
│       │   ├── pages/                       # Public pages:
│       │   │   ├── home/
│       │   │   ├── bhajans/                 # Index & detail
│       │   │   ├── articles/                # Index & detail
│       │   │   ├── festivals/               # Index & detail (/festivals/:id, /festivals/:slug)
│       │   │   ├── puranas/                 # Index & detail (/puranas/:slug)
│       │   │   ├── deities/                 # Deities list (/gods, /deities)
│       │   │   ├── categories/              # Categories list
│       │   │   ├── collections/             # Collection details (/gods/:id, /deities/:id, /categories/:id)
│       │   │   ├── videos/                  # Video list & detail
│       │   │   ├── search/ & explore/       # Search and discover
│       │   │   ├── legal/                   # Terms, Privacy, Disclaimer, About
│       │   │   ├── donate/                  # Donate / Support Us
│       │   │   ├── favorites/               # Client-side favorites (/favorites, /favourite)
│       │   │   └── contact/                 # Contact form
│       │   └── routes/                      # UserRoutes (root public path mappings)
│       ├── components/                      # SHARED COMPONENTS
│       │   ├── ui/                          # Button, Card, Badge, Modal, Input, Table, etc.
│       │   ├── form/                        # ImageUploadWithCrop, RichTextEditor, TagInput
│       │   └── common/                      # SafeHtmlContent, ErrorBoundary, LoadingSpinner
│       ├── api/                             # Central API client (apiClient, uploadFile, etc.)
│       ├── hooks/                           # Custom React hooks (useToast, etc.)
│       ├── utils/                           # Host utilities (host.ts), formatting, helpers
│       ├── lib/                             # Utility classes (cn, etc.)
│       │   └── supabase.ts                  # DEPRECATED ORPHANED CLIENT (DO NOT USE)
│       ├── i18n/                            # Language dictionaries & helpers
│       └── routes/                          # AppRoutes dispatcher & LegacyAdminRedirect
├── backend/                                 # Express + Node.js + TypeScript Application
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── server.ts                        # HTTP server listener
│   │   ├── app.ts                           # Express app configuration & middleware pipeline
│   │   ├── admin/                           # Admin controllers & services:
│   │   │   ├── controllers/                 # ai, article, author, auth, dashboard, festival, puran
│   │   │   ├── services/                    # AiJobService, ai/AiWorker.ts, ai/AiProvider.ts
│   │   │   └── routes/                      # admin.routes.ts
│   │   ├── features/                        # Domain feature modules:
│   │   │   ├── bhajans/                     # BhajanController, BhajanService, BhajanRepository, BhajanRoutes
│   │   │   ├── categories/                  # CategoryController, CategoryService, CategoryRepository, CategoryRoutes
│   │   │   ├── deities/                     # DeityController, DeityService, DeityRepository, DeityRoutes
│   │   │   ├── tags/                        # TagController, TagService, TagRepository, TagRoutes
│   │   │   ├── youtube/                     # YoutubeController, YoutubeService, YoutubeRepository, YoutubeSyncService
│   │   │   ├── seo/                         # SeoController, SeoService, SeoRepository, SeoRoutes
│   │   │   └── translations/                # TranslationController, TranslationService, TranslationRoutes
│   │   ├── controllers/                     # ContactController, MediaController, PaymentController, PublicController, SettingsController
│   │   ├── services/                        # ArticleService, AuthorService, FestivalService, MediaService, PuranService, SettingsService
│   │   │   └── storage/                     # BackblazeStorageService.ts
│   │   ├── repositories/                    # ArticleRepository, AuthorRepository, FestivalRepository, MediaRepository, PuranRepository, SettingsRepository
│   │   ├── routes/                          # cron, health, index, media, public, puranas, settings
│   │   ├── middlewares/                     # auth, validation, rateLimiter, error handling
│   │   ├── config/                          # PostgreSQL Pool (database.ts) & Environment variables
│   │   ├── utils/                           # Slug generator, logger, helpers
│   │   └── types/                           # Express & domain TypeScript types
│   └── supabase/
│       └── migrations/                      # PostgreSQL DDL migrations & tables
└── vercel.json                              # Vercel deployment & SPA routing rewrites
```

---

## 3. Host Detection & Routing Mechanics

Aradhna Marg runs on a single React application that dynamically branches based on the browser's hostname ([ADR 001](docs/architecture/001-public-admin-host-separation.md)):

### Host Utilities (`frontend/src/utils/host.ts`)
```typescript
export const isAdminHost = (): boolean => {
  const host = window.location.hostname;
  return host.startsWith('admin.') || host.includes('aradhna-marg-admin');
};

export const isPublicHost = (): boolean => {
  return !isAdminHost();
};
```

### Routing Dispatcher (`frontend/src/routes/index.tsx`)
1. **On Admin Host (`admin.aradhnamarg.com`)**:
   - The root `/` path renders `AdminRoutes`.
   - Paths include `/login`, `/dashboard`, `/bhajans`, `/articles`, `/festivals`, `/puranas`, `/settings`, etc.
2. **On Public Host (`aradhnamarg.com`)**:
   - The root `/` path renders `UserRoutes`.
   - Accessing `/admin` or `/admin/*` on the public host triggers `LegacyAdminRedirect`, automatically redirecting to `https://admin.aradhnamarg.com`.
3. **In Local Development (`localhost:5173`)**:
   - Dual-mode routing is enabled:
     - `/` mounts `UserRoutes`.
     - `/admin/*` mounts `AdminRoutes`.
   - This allows seamless local development of both public and admin features without modifying local host configs.

---

## 4. Layered Backend Architecture & Data Flow

All application data follows a strict 4-tier flow ([ADR 002](docs/architecture/002-backend-only-database-access.md)):

```
┌──────────────────────────────────────────┐
│      Frontend React (apiClient)          │
└────────────────────┬─────────────────────┘
                     │ HTTP JSON Request
┌────────────────────▼─────────────────────┐
│  Express Controller (src/controllers/)    │  Unpack params, query, body
└────────────────────┬─────────────────────┘
                     │ Calls typed method
┌────────────────────▼─────────────────────┐
│   Business Service (src/services/)       │  Validates, handles transactions & logic
└────────────────────┬─────────────────────┘
                     │ Calls data query
┌────────────────────▼─────────────────────┐
│  Repository Layer (src/repositories/)    │  Constructs parameterized SQL
└────────────────────┬─────────────────────┘
                     │ Executes query
┌────────────────────▼─────────────────────┐
│   DatabaseClient (src/config/database)   │  pg.Pool executes on PostgreSQL
└──────────────────────────────────────────┘
```

### Critical Rules
- **Zero Direct Database Access in Frontend**:
  Frontend code must **NEVER** query PostgreSQL or Supabase directly.
  The file `frontend/src/lib/supabase.ts` is legacy/orphaned code and **MUST NOT** be imported, used, or resurrected by new development or autonomous agents.
  The only permitted data-access flow is:
  `Frontend → apiClient → Controller → Service → Repository → DatabaseClient / PostgreSQL`.
- **Parameterized SQL**: Repositories must ALWAYS use `$1, $2, ...` placeholders. Concatenating raw variables into SQL is strictly forbidden.
- **Transactions**: Multi-table updates must use `DatabaseClient.getClient()` to run queries within an explicit `BEGIN` / `COMMIT` / `ROLLBACK` block.

---

## 5. Content Model & Entities

### 5.1 Bhajans (`bhajans`)
- **Key Columns**:
  - `id` (UUID), `title` (VARCHAR), `hindi_title` (VARCHAR), `slug` (VARCHAR, unique)
  - `lyrics` (TEXT, Devanagari script)
  - `clean_lyrics` (TEXT, stripped of annotations for search indexing)
  - `description`, `short_description` (TEXT, meanings and background)
  - `youtube_video_id` (VARCHAR, YouTube video ID reference)
  - `pdf_url` (VARCHAR, PDF document link)
  - `category_id` (UUID foreign key -> `categories`)
  - `god_id` (UUID foreign key -> historical `gods(id)`, actively joined against `deities` in repositories)
  - `festival_id` (UUID foreign key -> `festivals`)
  - `author_id` (UUID foreign key -> `authors`)
  - `status` (`DRAFT`, `PUBLISHED`)
  - `seo_title`, `seo_description`, `meta_keywords`, `seo_keywords`
- **Junctions**: `bhajan_gods`, `bhajan_tags`
- **Rule on Lyrics**: Bhajan lyrics are sacred devotional compositions. They must **NEVER** be translated into English by automated tools or AI.

### 5.2 Articles (`articles`)
- **Bilingual Structure**:
  - Hindi (Primary): `title`, `excerpt`, `content` (Rich HTML/Markdown)
  - English (Secondary): `title_en`, `excerpt_en`, `content_en`
  - SEO: `seo_title`, `seo_description`, `seo_title_en`, `seo_description_en`
- **Relationships**:
  - `category_id`, `author_id`, `featured_image_id`, `status`, `featured`, `publish_date`
  - Junctions: `article_bhajans`, `article_festivals`, `article_gods`, `article_tags`, `related_articles`
- **Tagging**: In-form custom tags are saved in article metadata without creating unapproved entries in the global master tags catalog.

### 5.3 Festivals (`festivals`)
- **Key Columns**:
  - `name`, `name_en`, `slug`
  - `festival_date` (DATE), `end_date` (DATE)
  - `short_description`, `short_description_en`, `content`, `content_en`
  - `banner_image`, `category`, `status`, `featured`
  - `seo_title`, `seo_description`, `seo_title_en`, `seo_description_en`
- **Junctions**: `festival_articles`, `festival_bhajans`
- **Status Filtering**: Case-insensitive status handling is enforced in `FestivalRepository` to handle varying filter cases (`draft`, `published`, `DRAFT`, `PUBLISHED`).

### 5.4 Puranas (`puranas`)
- **Sacred Text Policy**: Puran texts are voluminous scriptural works. They are represented in the CMS via:
  - Title (`title`, `title_en`), `slug`
  - Descriptions: `short_description`, `description_en`
  - Cover artwork: `cover_image`
  - Complete PDF document: `pdf_file` (hosted in Backblaze B2, managed via `BackblazeStorageService`)
  - Metrics: `view_count`, `download_count`, `display_order`, `language`, `author`, `status`
  - SEO: `seo_title`, `seo_description`, `seo_title_en`, `seo_description_en`
- **Rule**: Do not attempt to store millions of words of Sanskrit shlokas as rich text in CMS article fields.

### 5.5 Master Entities
- **Deities (`deities` / `gods`)**: Master deity profiles. Schema/history refers to the foreign-key column as `god_id` and historically references `gods(id)`, while active repository queries join `god_id` against the `deities` table. Public routes accept both `/gods` and `/deities`.
- **Categories (`categories`)**: Primary taxonomy classification (`features/categories/`).
- **Authors (`authors`)**: Content writers, scholars, and translators (`AuthorRepository`).
- **Tags (`tags`)**: Master tagging taxonomy (`features/tags/`).

---

## 6. Storage & Upload Architecture

### 6.1 Direct Upload Workflow ([ADR 003](docs/architecture/003-direct-upload-no-media-library.md))
- The frontend Media Library browsing page was removed from navigation to eliminate clutter and context-switching.
- All file uploads are direct and contextual:
  - **Images**: Uploaded via `ImageUploadWithCrop` which invokes `uploadFile()` in `frontend/src/api/upload.ts` targeting `POST /api/admin/media/files`. Handled by `MediaController.uploadFile` -> `MediaService.uploadFile` (converts image to WebP and compresses using `sharp`).
  - **Puran PDFs**: Uploaded via `uploadPuranPdf()` in `frontend/src/api/upload.ts` targeting `POST /api/admin/puranas/upload-pdf`. Handled by `adminPuranController.uploadPdf` -> `BackblazeStorageService.uploadPdf`.

### 6.2 Backblaze B2 Object Storage ([ADR 004](docs/architecture/004-backblaze-b2-object-storage.md))
- Managed by `BackblazeStorageService` (`backend/src/services/storage/BackblazeStorageService.ts`) using `@aws-sdk/client-s3`.
- **Environment Variables**:
  - `B2_REGION` (default: `'us-east-005'`)
  - `B2_ENDPOINT`
  - `B2_ACCESS_KEY_ID` (Secret)
  - `B2_SECRET_ACCESS_KEY` (Secret)
  - `B2_BUCKET_NAME`
- **Security Rule**: Credentials must remain strictly in backend environment variables. Never expose them to client JavaScript or documentation.

---

## 7. Authentication Architecture

- **Single-Tenant Stateless Admin Authentication**:
  - Validates credentials against environment variables `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
  - The endpoint `POST /api/admin/auth/login` checks the submitted username and password against these environment values.
  - Successful authentication signs a JSON Web Token (JWT) valid for 24 hours using `JWT_SECRET`.
  - `requireAdmin` middleware verifies token validity via `jwt.verify(token, config.JWT_SECRET)`.
  - **No active database user lookup is performed.**
  - **No active sessions-table validation is performed.**
  - Authentication is currently **stateless**.
- **Client Session Expiry**:
  - If the API returns a `401 Unauthorized`, `apiClient` intercepts the response and fires a custom `session-expired` event handled by `SessionManager.tsx`.

---

## 8. SEO Engine Architecture

The SEO Engine provides automated audit scoring, metadata diagnostics, and sitemap generation ([ADR 005](docs/architecture/005-seo-scope-website-vs-youtube.md)):

### Scope
- **Audited Tables**: `['bhajans', 'articles', 'festivals', 'puranas', 'categories']`.
- **Excluded Content**: YouTube synchronized video records (`youtube_videos`). These are external media references, not standalone website pages. They must not appear in website SEO audits or sitemaps.

### Fallbacks & Schema
- `seo_title` falls back to the content title.
- `seo_description` falls back to the excerpt or first 160 characters of clean content.
- Rich structured data is injected using schema.org:
  - `Article` for Articles
  - `MusicComposition` / `MusicRecording` for Bhajans
  - `Event` for Festivals
  - `Book` for Puranas
  - `VideoObject` embedded within pages that link to YouTube videos

---

## 9. YouTube Sync Architecture

- **Purpose**: Automates importing video references from official YouTube channels and playlists.
- **Implementation**: Located in `backend/src/features/youtube/` (`YoutubeVideoRepository`, `YoutubeSyncService`, `YoutubeController`).
- **Storage**: Records reside in `youtube_videos` table (`id`, `youtube_id`, `title`, `description`, `thumbnail_url`, `published_at`, `duration`, `import_status`).
- **Relationships**: A YouTube record is linked to a Bhajan via `youtube_video_id` or embedded in an Article.
- **Permanent Ignore Rule**:
  When a YouTube video record is deleted from `youtube_videos`, future channel syncs may re-import it. If the intention is to permanently ignore the video during synchronization, its `import_status` must be set to `IGNORED`.
- **Sync Operations**:
  - Channel sync via YouTube Data API v3.
  - Playlist sync for specific bhajan sets.
  - Manual video attachment via YouTube URL parsing in content forms.

---

## 10. AI Processing System

- **Database Table**: `ai_jobs`
  - Columns: `id`, `job_name`, `action_type`, `status` (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`), `content_id`, `content_type`, `progress`, `payload`, `result`, `error_message`, `created_at`, `updated_at`.
- **In-Process Worker (`AiWorker.ts`)**:
  - Located in `backend/src/admin/services/ai/AiWorker.ts`.
  - Runs an in-process polling check (`setInterval` every 20 seconds) claiming pending jobs using `FOR UPDATE SKIP LOCKED`.
- **Action Types Handled**:
  - `GENERATE_MEANING`: Generates devotional meaning for Bhajans in Hindi; updates `short_description` & `description` while leaving lyrics untouched.
  - `GENERATE_SUMMARY`: Generates article excerpt/summary.
  - `IMPROVE_GRAMMAR`: Enhances article grammatical structure.
  - `GENERATE_SEO`: Generates meta title, description, and keywords.
  - `IMPROVE_DESCRIPTION`: Enhances festival description.
  - `GENERATE_SHORT_DESC`: Generates Purana short description.
  - `BULK_SEO`, `BULK_EXCERPT`, `BULK_FESTIVAL`: Batch processing actions.
- **Rule on AI Outputs**:
  - All AI-generated content MUST default to `DRAFT` status.
  - Agents must **NEVER** automatically publish generated content without human approval ([ADR 006](docs/architecture/006-future-agentic-ai-permission-boundaries.md)).

---

## 11. Settings Architecture

Platform settings are organized into eight independent sections:
1. `general` (Site name, logo, footer text, default language)
2. `contact` (Support email, address, phone)
3. `social` (Twitter/X, Facebook, Instagram, YouTube links)
4. `youtube` (API keys, channel IDs, sync frequency)
5. `seo` (Default meta tags, analytics IDs, robots rules)
6. `analytics` (Tracking IDs, telemetry flags)
7. `advertisement` (Ad sense, banner slots, sponsor configs)
8. `system` (Maintenance mode, cache TTLs, logging levels)

### Settings Endpoints (`backend/src/routes/settings.routes.ts`)
- `GET /api/settings` (Full settings read)
- `PUT /api/settings/:section` (Granular updates: `/general`, `/contact`, `/social`, `/youtube`, `/seo`, `/analytics`, `/advertisement`, `/system`)
- **Rule**: Do NOT consolidate these into a single monolithic save endpoint.

---

## 12. Internationalization & Typography

- **Bilingual Content**: Aradhna Marg supports Hindi and English.
- **Hindi Font Convention**: Uses **Anek Devanagari** for all Hindi headings and body copy.
- **Typography Rules**:
  - Maintain vertical alignment between Hindi text and adjacent icons.
  - Respect Devanagari matras (vowel signs above and below letters); avoid clipping due to aggressive line-height (`leading`) settings.
  - Do not apply automated text formatting that alters sacred Sanskrit stanzas or diacritical markings.

---

## 13. UI/UX Design System

- **Color Palette**:
  - Warm Saffron & Gold accents (`amber-500`, `orange-600`, `yellow-500`)
  - Deep Spiritual Maroons (`red-900`, `rose-950`)
  - Clean Slate & Dark Mode backgrounds (`slate-900`, `zinc-900`)
- **Component Inventory**:
  - Buttons: `frontend/src/components/ui/Button.tsx`
  - Cards: `frontend/src/components/ui/Card.tsx`
  - Badges: `frontend/src/components/ui/Badge.tsx` (borderless)
  - Modals: `frontend/src/components/ui/Modal.tsx`
  - Inputs: `frontend/src/components/ui/Input.tsx`
  - Tables: `frontend/src/components/ui/Table.tsx`
  - Tabs: `frontend/src/components/ui/Tabs.tsx`
  - Rich Text: `frontend/src/components/form/RichTextEditor.tsx`
  - Image Cropper: `frontend/src/components/form/ImageUploadWithCrop.tsx`
- **Drafts Management UX**:
  - Content management lists (Articles, Bhajans, Festivals, Puranas) include a dedicated "Drafts" view/button to the left of "Create" to allow quick review and actions on unpublished items.

---

## 14. Future Agentic AI Boundaries & Approval Model

All autonomous subagents, workers, and background tools must follow the permission tiering defined in [ADR 006](docs/architecture/006-future-agentic-ai-permission-boundaries.md):

```
┌────────────────────────────────────────────────────────┐
│                   HUMAN OPERATOR                       │
│    (Approves Tier 5 Publish & Authorizes Mutations)    │
└───────────────────────────▲────────────────────────────┘
                            │ Approval / Sign-off
┌───────────────────────────┴────────────────────────────┐
│                    AI AGENT LAYER                      │
├────────────────────────────────────────────────────────┤
│ Tier 1: READ            - Public pages, schema checks  │
│ Tier 2: ANALYZE         - SEO audits, duplicate checks │
│ Tier 3: PROPOSE         - Draft articles, suggestions  │
│ Tier 4: MODIFY DRAFTS   - Edit unpublished DRAFT items │
└───────────────────────────┬────────────────────────────┘
                            │ Typed Tool Calls
┌───────────────────────────▼────────────────────────────┐
│                APPROVED BACKEND TOOLS                  │
│       (Input validation, role checks, auditing)        │
└───────────────────────────┬────────────────────────────┘
                            │ Service Methods
┌───────────────────────────▼────────────────────────────┐
│             BACKEND SERVICE & REPOSITORY               │
└────────────────────────────────────────────────────────┘
```

- **Tier 1 & Tier 2**: Fully autonomous read and analysis operations.
- **Tier 3**: Propose generated content or tags (saved as `DRAFT`).
- **Tier 4**: Modify existing `DRAFT` records (never live published records).
- **Tier 5**: Moving `DRAFT` to `PUBLISHED` or mutating live records requires explicit human approval.
- **Tier 6**: Destructive operations (hard delete, drop tables, purge buckets) are **strictly forbidden** autonomously.

---

## 15. Known Architectural Gaps & Nuances

When inspecting or extending the codebase, be aware of the following nuances:

1. **In-Process AI Worker vs Standalone Daemon**:
   - `AiWorker` runs inside the Express server process via `setInterval` polling every 20 seconds.
   - It operates cleanly for moderate workloads with `FOR UPDATE SKIP LOCKED`, but is not an isolated worker daemon (e.g. BullMQ/Redis).
2. **Deities Table vs Gods Column**:
   - Schema and history refer to the foreign-key column as `god_id` and historically reference `gods(id)`, while active repository queries join `god_id` against the `deities` table.
   - Public frontend routes support both `/gods` and `/deities` paths.
3. **Festival Status Normalization**:
   - Database and code historically mixed lowercase (`draft`) and uppercase (`DRAFT`). `FestivalRepository` explicitly normalizes status casing in SQL queries.

---

## 16. Safe Change Protocol

Follow this workflow for every change in the Aradhna Marg repository:

1. **Inspect First**: Check existing routes, controllers, and services before writing code.
2. **No Unrequested Refactoring**: Modify only the code necessary to satisfy the prompt.
3. **Preserve Compatibility**: Keep the local development `/admin` compatibility route intact.
4. **Enforce Backend Authorization**: Never rely solely on frontend route guards.
5. **Verify Compilations**:
   ```bash
   # In frontend/
   npm run build

   # In backend/
   npm run build
   ```
6. **Inspect Git Diff**: Ensure no secrets, unwanted files, or accidental package changes are present.
