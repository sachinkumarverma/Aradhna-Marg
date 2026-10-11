# ADR 007: Phase 5A Autonomous Read/Analyze Agent Infrastructure

## Status
Accepted

## Context
Following the establishment of ADR 006 (Agentic AI Permission Boundaries), Phase 4 introduced typed tools, human-approved proposals (`agent_proposals`), ToolGateway guardrails, stale protection, and proposal immutability.

Phase 5A requires building the platform's first controlled autonomous execution layer. While future phases will address scheduling (Phase 5B) and multi-agent systems, Phase 5A must guarantee safe, bounded, policy-enforced autonomous execution with:
1. Zero autonomous content mutation (no publishing, modification, or deletion).
2. Autonomous reasoning and analysis restricted to approved READ and ANALYZE operations (Tiers 1 & 2).
3. Grounded evaluation and structured findings (no private chain-of-thought persisted or displayed).
4. Deterministic limit enforcement (maximum iterations, maximum tool calls, strict timeout aborts).
5. Protection of Sacred Content (Bhajan lyrics/shlokas are never analyzed or transformed as regular prose).
6. Total exclusion of imported YouTube videos from website SEO audits and quality analysis.

## Decision
1. **Server-Side Policy-Based Autonomy (`AgentDefinition` & `AgentRegistry`)**:
   - Autonomy is strictly granted by server-side policy, not by AI model self-selection.
   - Every autonomous agent is registered in `AgentRegistry` with a immutable `AgentDefinition` specifying:
     - Unique identifier and descriptive purpose
     - Permission tier (`TIER_1_READ` or `TIER_2_ANALYZE` only)
     - Explicit list of `allowedTools`
     - Explicit list of `allowedEntityTypes`
     - `maxIterations`, `maxToolCalls`, and `timeoutMs`
     - `dryRunOnly: true` (strictly enforced at ToolGateway level)
   - Any unregistered agent trigger is rejected immediately with a 404/NotFoundError.
   - Client requests cannot escalate permissions or specify arbitrary tools.

2. **Common Orchestrator (`AgentRunner`)**:
   - Manages the complete agent run lifecycle using `agent_runs` (`RUNNING` -> `COMPLETED` / `FAILED`).
   - Wraps autonomous execution in a race against `timeoutMs`, preventing infinite loops or hanging tasks.
   - Automatically catches and logs errors, persisting clean `errorMessage` and failure reasons.
   - Persists structured `AgentRunState` containing `summary`, `findings`, and `metrics`.

3. **ToolGateway Policy & Auditing Boundary**:
   - Inspects `context.agentName` against `AgentRegistry`.
   - Rejects and logs any tool invocation not explicitly listed in `agentDef.allowedTools`.
   - Blocks any tool with Tier 3-6 permissions when `agentDef.dryRunOnly` is active.
   - Enforces loop iteration limits (`currentIteration >= maxIterations`).
   - Automatically redacts sensitive secrets (passwords, tokens, API keys, JWTs) from input payloads before persisting to `agent_tool_calls`.

4. **Three Autonomous Phase 5A Agents**:
   - **`seo_audit_agent`**: Autonomous website SEO auditor evaluating Bhajans, Articles, Festivals, Puranas, and Categories against title length, description presence, and slug uniqueness. Excludes YouTube imported records.
   - **`system_health_agent`**: Autonomous operational health auditor inspecting database ping, AI job queue backlog/failures, agent execution metrics, and runtime memory. Outputs deterministic `HEALTHY`, `WARNING`, or `CRITICAL` statuses based on grounded metrics without mutating jobs or services.
   - **`content_quality_agent`**: Autonomous editorial auditor identifying formatting issues, missing excerpts, short prose, and readability anomalies across Articles, Festivals, Puranas, and Bhajan descriptions. Enforces the Sacred Content Firewall: lyrics and shlokas are strictly omitted from analysis batches and cannot be rewritten.

5. **Structured Findings Contract (`AgentFinding`)**:
   - Results are strictly structured with `type`, `severity`, `entityType`, `entityId`, `title`, `message`, `recommendation`, and `evidence`.
   - Hidden AI chain-of-thought is never persisted to database or exposed in the Admin UI.

6. **Admin API & AI Processing UI**:
   - `GET /api/admin/agents/definitions`: Lists registered autonomous agents and their policies.
   - `GET /api/admin/agents/definitions/:id`: Retrieves specific agent policy.
   - `POST /api/admin/agents/:id/run`: Manually triggers an autonomous agent run.
   - Admin UI adds an **Agent Runs** tab under `/admin/ai` displaying past runs, structured findings inspection modal with severity badges, and tool call timelines.

## Consequences
- **Positive**: Controlled autonomous execution safely operationalized without risk of unintended database writes or data corruption. Audited tool calls provide complete traceability.
- **Negative**: Agents cannot automatically apply fixes or create proposals directly in Phase 5A (recommendations are advisory and must be acted upon in human-in-the-loop workflows).
- **Rules**:
  - Phase 5A agents must always have `dryRunOnly: true`.
  - Never allow autonomous agents to execute SQL or bypass the 4-layer architecture.
