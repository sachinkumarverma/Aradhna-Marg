# ADR 002: Backend-Only Database Access and Layered API Flow

## Status
Accepted

## Context
In many modern serverless or Supabase tutorials, frontend clients directly execute SQL or use client-side SDKs (`supabase.from('table').select()`) with Row Level Security (RLS). 

In Aradhna Marg, direct frontend database queries create severe risks:
1. Leaking business logic, data models, or credentials to the browser.
2. Inconsistent validation, caching, transaction management, and sanitization across public and admin clients.
3. Vulnerability to client-side tampering, uncontrolled data scraping, or accidental schema exposure.
4. Inability to enforce server-side workflows (e.g. audit logging, AI queueing, relationship cascading, automated slug generation).

## Decision
1. **Zero Direct Database Access from Frontend**:
   - The React frontend (`frontend/`) must **NEVER** import database drivers (`pg`, `mysql`), execute raw SQL, or use client-side Supabase query builders to read or mutate application data.
   - All frontend queries and mutations MUST travel through the unified backend API client (`frontend/src/api/client.ts`).
2. **Explicit Deprecation of Legacy Frontend Supabase Client**:
   - The file `frontend/src/lib/supabase.ts` is legacy/orphaned code and **MUST NOT** be imported, used, or resurrected by new development or autonomous agents.
   - Frontend code must **NEVER** query PostgreSQL/Supabase directly.
   - The only permitted data-access flow is:
     ```
     Frontend
        ↓ (apiClient HTTP)
     Backend Controller
        ↓
     Backend Service
        ↓
     Backend Repository
        ↓
     DatabaseClient / PostgreSQL
     ```
3. **Layered Backend Architecture**:
   All data flow follows a strict 4-layer architecture:
   ```
   Frontend (@api/client.ts)
          ↓ (HTTP / REST JSON)
   Backend Controller (HTTP request handling, status codes, input unpacking)
          ↓
   Backend Service (Business logic, validation, transactions, side effects)
          ↓
   Backend Repository (SQL queries, parameterized statements, mapping)
          ↓
   Database Client (pg.Pool / PostgreSQL)
   ```
4. **Repository Responsibilities**:
   - Repositories are the only layer allowed to construct and execute SQL queries via `DatabaseClient.query()`.
   - All queries MUST use parameterized inputs (`$1, $2, ...`) to prevent SQL injection.
5. **Service Responsibilities**:
   - Services coordinate business rules, slug collisions, relationship synchronizations (e.g., tags, deities, festivals), and logging.
   - Controllers must not contain SQL or heavy business logic.

## Consequences
- **Positive**: Strict encapsulation, centralized audit trails, consistent validation, zero risk of browser SQL injection or client-side RLS misconfiguration leaks.
- **Negative**: Requires defining controller, service, repository, and API client types when introducing new endpoints.
- **Rules for Future Agents**:
  - Never import or call `frontend/src/lib/supabase.ts`.
  - Never add Supabase client-side data queries (`supabase.from(...)`) to React components or hooks.
  - Never skip the Service layer to query Repositories directly from Controllers unless handling a purely trivial pass-through with no business logic.
  - Never run raw queries in Controllers.
