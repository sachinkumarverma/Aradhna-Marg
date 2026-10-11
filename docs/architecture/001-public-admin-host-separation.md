# ADR 001: Public and Admin Host Separation

## Status
Accepted

## Context
Aradhna Marg serves two fundamentally distinct user groups:
1. **Public Devotional Readers**: Users visiting the platform to read bhajans, explore articles, read Puranas, study festival schedules, and engage with Sanatan Dharma content.
2. **Platform Administrators**: Content editors, SEO managers, and site administrators managing content, scheduling, automation, YouTube sync, AI tasks, and platform settings.

Initially, admin routes lived alongside public routes on the same domain (e.g., `/admin`). To provide a cleaner separation, enhanced brand trust, independent deployment management, and isolated navigation context, a dedicated admin subdomain was established.

## Decision
1. **Production Host Separation**:
   - Public Website: `https://aradhnamarg.com` (also aliased on preview domains such as `aradhna-marg.vercel.app`).
   - Admin Application: `https://admin.aradhnamarg.com` (also aliased on preview domains such as `aradhna-marg-admin.vercel.app`).
2. **Single Monorepo Codebase**:
   - Both applications reside in the single `frontend/` React codebase.
   - Routing branching is driven by hostname detection in `frontend/src/utils/host.ts` (`isAdminHost()` and `isPublicHost()`).
3. **Routing Behaviors**:
   - On the **Admin Host** (`admin.aradhnamarg.com`), root `/` mounts `AdminRoutes` directly (`/login`, `/dashboard`, `/bhajans`, etc.).
   - On the **Public Host** (`aradhnamarg.com`), root `/` mounts `UserRoutes` (devotional pages). If a user accesses `/admin` or `/admin/*` on the public host, `LegacyAdminRedirect` redirects the browser to `https://admin.aradhnamarg.com`.
   - In **Local Development** (`localhost`): Dual-mode is preserved for development convenience. Root `/` serves public routes while `/admin/*` serves admin routes simultaneously.
4. **Security Boundary Rule**:
   - Hostname separation is an architectural and UX boundary, **NOT a security boundary**.
   - Admin routes and API endpoints are strictly protected by backend JWT authentication. Authentication is single-tenant and stateless, validating against environment variables `ADMIN_USERNAME` and `ADMIN_PASSWORD`. Signed JWTs (valid for 24 hours) are verified in `requireAdmin` middleware using `JWT_SECRET`. No active database user lookup or `sessions` table validation is performed. The frontend routing checks never substitute for backend security.

## Consequences
- **Positive**: Clean user isolation, reduced risk of admin components bleeding into public bundles, clear URL identity.
- **Negative**: Developers must maintain host-aware linking (`getAdminBaseUrl()` / `getPublicBaseUrl()`).
- **Rules for Future Agents**:
  - Never remove the local development `/admin` compatibility fallback.
  - Never place admin management logic or components into `frontend/src/user/`.
  - Always verify authorization in backend controllers and middleware regardless of host checks.
