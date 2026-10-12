# ADR 006: Future Agentic AI Architecture, Permission Boundaries, and Human Approval Model

## Status
Accepted

## Context
As Aradhna Marg plans the introduction of Agentic AI (e.g. automated content generation, SEO analysis, metadata enrichment, duplicate detection, YouTube transcription/categorization), clear architectural guardrails must be established *before* implementing any AI agents.

Unrestricted agent access risks:
1. Hallucinated or corrupted devotional/scriptural texts (e.g., incorrect Sanskrit shlokas, corrupted bhajan lyrics).
2. Accidental deletion or overwriting of production content.
3. Unsanitized direct SQL execution leading to data corruption or data loss.
4. Leaking secrets or exposing administrative endpoints to autonomous bots.
5. Undetected mass publishing of low-quality or inaccurate automated articles.

## Decision
1. **No Direct Production Database or SQL Access for AI Agents**:
   - AI agents must NEVER receive direct access to production database credentials, raw PostgreSQL client instances, or arbitrary SQL execution tools.
   - All agent operations must execute through strict, strongly typed, approved backend tools and service methods:
     ```
     AI Agent
        ↓ (Typed tool calls / parameters)
     Approved Tool Interface (Input validation, schema checks)
        ↓
     Backend Service (Business logic, status checks, audit logging)
        ↓
     Repository
        ↓
     Database
     ```
2. **Granular Tiered Permission Matrix**:
   Agent operations are categorized into six distinct tiers:
   - **TIER 1: READ** (Autonomous): Read public content, inspect metadata, examine published pages.
   - **TIER 2: ANALYZE** (Autonomous): Generate SEO audit scores, detect broken links, identify duplicate tags, check reading grade level.
   - **TIER 3: PROPOSE** (Autonomous): Generate draft articles, propose meta descriptions, suggest related bhajans or tags, format lyrics into clean stanzas. Output is saved strictly in DRAFT status or returned as structured proposals.
   - **TIER 4: MODIFY DRAFTS** (Autonomous with review logging): Update content explicitly flagged with `status = 'DRAFT'`.
   - **TIER 5: PUBLISH / OVERWRITE** (**HUMAN APPROVAL REQUIRED**): Transitioning content from `DRAFT` to `PUBLISHED`, updating live published bhajans/articles, changing live categories or deities. Requires explicit human sign-off via Admin UI or terminal confirmation.
   - **TIER 6: DELETE / DESTRUCTIVE** (**RESTRICTED / EXPLICIT HUMAN CONFIRMATION ONLY**): Hard deleting content, dropping tables, truncating queues, purging storage buckets, modifying authentication, or altering database schemas. Agents must **NEVER** execute Tier 6 operations autonomously.
3. **Sacred Content Inviolability**:
   - Bhajan lyrics and Sanskrit verses must **NEVER** be automatically translated by AI into English or altered for grammatical modernizations without explicit human review. Bhajan lyrics represent devotional poetry and sacred composition.

## Consequences
- **Positive**: Zero risk of catastrophic data loss, preserved integrity of devotional and scriptural content, transparent audit trail for all AI-assisted actions.
- **Negative**: Agents cannot perform end-to-end autonomous publishing without human verification steps.
- **Rules for Future Agents**:
  - Always default generated content status to `DRAFT`.
  - Never execute `DELETE` or destructive updates without human confirmation.
  - Implement AI workflows through discrete jobs in `ai_jobs` with status transitions (`PENDING` -> `PROCESSING` -> `COMPLETED` / `FAILED`).
