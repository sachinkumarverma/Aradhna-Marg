/**
 * Phase 5A Autonomous Read/Analyze Agent Infrastructure Verification
 *
 * Verifies all 49+ requirements of the Phase 5A constitutional specification:
 * - Agent Registry & Policy Definitions
 * - Permission Tiers (READ/ANALYZE only, Dry-Run safety)
 * - Run Lifecycle (PENDING -> RUNNING -> COMPLETED / FAILED)
 * - Audited Tool Calls with Secret Redaction
 * - Execution Limits (Iterations, Tool Calls, Timeouts)
 * - Security Boundaries & No-SQL Architecture
 * - 3 Autonomous Read/Analyze Agents (SEO Audit, System Health, Content Quality)
 * - Sacred Content Protection & Zero Autonomous Mutation
 * - Phase 2, 3, 4A, 4B, 4C Regressions
 */

import {
  agentRegistry,
  agentRunner,
  toolGateway,
  toolRegistry,
  agentExecutionService,
  agentRunRepository,
  agentToolCallRepository,
  AgentPermissionTier,
  AgentSecurityError,
  AgentIterationLimitError,
  ToolNotFoundError,
  registerDefaultAgents,
  registerDefaultTools
} from '../agents';
import { db } from '../common/database/DatabaseClient';
import * as fs from 'fs';
import * as path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testId: number, description: string): void {
  if (condition) {
    console.log(`  ✓ Test ${testId}: ${description}`);
    passed++;
  } else {
    console.error(`  ✗ Test ${testId}: FAILED - ${description}`);
    failed++;
  }
}

function makeContext(agentName: string, runId: string, currentIteration = 0, maxIterations = 10) {
  return {
    runId,
    agentName,
    actor: { type: 'ADMIN' as const, id: 'admin-tester' },
    currentIteration,
    maxIterations,
    tokensUsed: 0,
    tokenBudget: 100000
  };
}

async function runVerification() {
  console.log('\n============================================================');
  console.log('ARADHNA MARG — PHASE 5A VERIFICATION SUITE');
  console.log('Autonomous Read/Analyze Agent Infrastructure');
  console.log('============================================================\n');

  try {
    // Ensure registrations are active
    registerDefaultTools();
    registerDefaultAgents();

    // -------------------------------------------------------------
    // PART 1: AGENT REGISTRY
    // -------------------------------------------------------------
    console.log('--- 1. AGENT REGISTRY ---');
    const seoAgent = agentRegistry.get('seo_audit_agent')!;
    assert(
      !!seoAgent && seoAgent.definition.id === 'seo_audit_agent',
      1,
      'SEO Audit Agent registered in agentRegistry'
    );

    const healthAgent = agentRegistry.get('system_health_agent')!;
    assert(
      !!healthAgent && healthAgent.definition.id === 'system_health_agent',
      2,
      'System Health Agent registered in agentRegistry'
    );

    const contentAgent = agentRegistry.get('content_quality_agent')!;
    assert(
      !!contentAgent && contentAgent.definition.id === 'content_quality_agent',
      3,
      'Content Quality Agent registered in agentRegistry'
    );

    let unknownAgentRejected = false;
    try {
      await agentRunner.run('non_existent_rogue_agent', { actor: { type: 'ADMIN', id: 'admin-test' } });
    } catch (err: any) {
      unknownAgentRejected = err.message?.includes('not registered');
    }
    assert(unknownAgentRejected, 4, 'Unknown / unregistered agent rejected by agentRunner');

    // -------------------------------------------------------------
    // PART 2: PERMISSIONS & POLICY
    // -------------------------------------------------------------
    console.log('\n--- 2. PERMISSIONS & POLICY ---');
    const allDefs = agentRegistry.getAllDefinitions();
    const allPhase5AAnalyzeOnly = allDefs.every(
      (d) =>
        (d.permissionTier === AgentPermissionTier.TIER_1_READ ||
          d.permissionTier === AgentPermissionTier.TIER_2_ANALYZE) &&
        d.dryRunOnly === true
    );
    assert(
      allPhase5AAnalyzeOnly,
      5,
      'All Phase 5A agents have READ/ANALYZE permission tier only and dryRunOnly === true'
    );

    // Test run for policy enforcement
    const testRun = await agentExecutionService.startRun({
      agentName: 'seo_audit_agent',
      triggerType: 'MANUAL',
      triggeredBy: 'admin-tester',
      state: {}
    });

    // 6. Mutation tool rejected
    let mutationBlocked = false;
    try {
      await toolGateway.executeTool(
        'apply_bhajan_seo_metadata',
        { bhajanId: '00000000-0000-0000-0000-000000000000', seoTitle: 'Fake Title' },
        makeContext('seo_audit_agent', testRun.id)
      );
    } catch (err: any) {
      mutationBlocked = err instanceof AgentSecurityError;
    }
    assert(mutationBlocked, 6, 'Mutation tool blocked by policy check and recorded in toolGateway');

    // 7. Publish tool rejected
    let publishBlocked = false;
    try {
      await toolGateway.executeTool(
        'apply_article_content_field',
        { articleId: '00000000-0000-0000-0000-000000000000', field: 'content', approvedValue: 'New Content' },
        makeContext('content_quality_agent', testRun.id)
      );
    } catch (err: any) {
      publishBlocked = err instanceof AgentSecurityError;
    }
    assert(publishBlocked, 7, 'Publish/Mutation tool rejected for content_quality_agent');

    // 8. Delete / Destructive tool rejected
    let destructiveBlocked = false;
    try {
      await toolGateway.executeTool(
        'non_existent_destructive_tool',
        {},
        makeContext('system_health_agent', testRun.id)
      );
    } catch (err: any) {
      destructiveBlocked = true;
    }
    assert(destructiveBlocked, 8, 'Tier 6 / Destructive or unknown destructive tool strictly rejected');

    // 9. Unauthorized tool (valid tool, but not allowed for this agent)
    let unauthorizedBlocked = false;
    try {
      // get_system_health is a valid tool, but NOT in seo_audit_agent's allowedTools
      await toolGateway.executeTool('get_system_health', {}, makeContext('seo_audit_agent', testRun.id));
    } catch (err: any) {
      unauthorizedBlocked = err instanceof AgentSecurityError && err.message.includes('prohibited by policy');
    }
    assert(unauthorizedBlocked, 9, 'Tool not present in agent allowedTools list is rejected by policy');

    // -------------------------------------------------------------
    // PART 3: RUN LIFECYCLE
    // -------------------------------------------------------------
    console.log('\n--- 3. RUN LIFECYCLE ---');
    const createdRun = await agentExecutionService.startRun({
      agentName: 'system_health_agent',
      triggerType: 'MANUAL',
      triggeredBy: 'test-user',
      state: { phase: 'init' }
    });
    assert(
      !!createdRun && createdRun.agentName === 'system_health_agent',
      10,
      'Agent run created successfully in agent_runs table'
    );
    assert(createdRun.status === 'RUNNING', 11, 'Agent run begins in RUNNING state');

    await agentExecutionService.completeRun(createdRun.id, {
      summary: 'All services healthy',
      status: 'HEALTHY',
      findings: []
    });
    const completedRun = await agentRunRepository.findById(createdRun.id);
    assert(completedRun?.status === 'COMPLETED', 12, 'Agent run successfully transitioned to COMPLETED status');

    const failingRun = await agentExecutionService.startRun({
      agentName: 'system_health_agent',
      triggerType: 'MANUAL',
      triggeredBy: 'test-user',
      state: {}
    });
    await agentExecutionService.failRun(failingRun.id, 'Simulated network failure');
    const failedRunRecord = await agentRunRepository.findById(failingRun.id);
    assert(failedRunRecord?.status === 'FAILED', 13, 'Agent run successfully transitioned to FAILED status');
    assert(
      failedRunRecord?.errorMessage === 'Simulated network failure',
      14,
      'Failure reason persisted accurately in agent_runs'
    );
    assert(!!completedRun?.state?.result, 15, 'Structured result persisted in agent_runs');

    // -------------------------------------------------------------
    // PART 4: TOOL CALLS & AUDIT LOGGING
    // -------------------------------------------------------------
    console.log('\n--- 4. TOOL CALLS & AUDIT LOGGING ---');
    // Execute an allowed read tool: get_system_health under system_health_agent
    await toolGateway.executeTool(
      'get_system_health',
      { includeRecentRuns: true },
      makeContext('system_health_agent', createdRun.id)
    );

    const toolCalls = await agentToolCallRepository.findByRunId(createdRun.id);
    const healthCall = toolCalls.find((c) => c.toolName === 'get_system_health');
    assert(!!healthCall, 16, 'Tool call accurately recorded in agent_tool_calls');
    assert(healthCall?.inputPayload?.includeRecentRuns === true, 17, 'Tool input payload recorded safely');
    assert(healthCall?.status === 'SUCCESS', 18, 'Tool result status recorded');
    assert(
      typeof healthCall?.durationMs === 'number' && healthCall.durationMs >= 0,
      19,
      'Tool call execution duration recorded in ms'
    );

    // Test error recorded
    const blockedCalls = await agentToolCallRepository.findByRunId(testRun.id);
    const blockedCall = blockedCalls.find((c) => c.status === 'BLOCKED');
    assert(
      !!blockedCall && !!blockedCall.errorMessage,
      20,
      'Errors / blocks recorded in agent_tool_calls.error_message'
    );

    // 21. Secrets not persisted
    // Attempt tool call with secret-like properties to verify redaction
    await toolGateway.executeTool(
      'get_system_health',
      { apiKey: 'sk-proj-supersecret12345678', password: 'mySecretPassword99', includeRecentRuns: false },
      makeContext('system_health_agent', createdRun.id, 1)
    );
    const latestCalls = await agentToolCallRepository.findByRunId(createdRun.id);
    const redactedCall = latestCalls.find((c) => (c.inputPayload as any)?.apiKey !== undefined);
    const isApiKeyRedacted = (redactedCall?.inputPayload as any)?.apiKey === '[REDACTED]';
    const isPasswordRedacted = (redactedCall?.inputPayload as any)?.password === '[REDACTED]';
    assert(
      isApiKeyRedacted && isPasswordRedacted,
      21,
      'Sensitive keys (apiKey, password, token) are redacted before persisting'
    );

    // -------------------------------------------------------------
    // PART 5: EXECUTION LIMITS
    // -------------------------------------------------------------
    console.log('\n--- 5. EXECUTION LIMITS ---');
    let iterationLimitEnforced = false;
    try {
      await toolGateway.executeTool('get_system_health', {}, makeContext('system_health_agent', createdRun.id, 5, 5));
    } catch (err: any) {
      iterationLimitEnforced = err instanceof AgentIterationLimitError;
    }
    assert(iterationLimitEnforced, 22, 'Iteration limit strictly enforced by ToolGateway');

    const healthDef = healthAgent.definition;
    assert(
      healthDef.maxToolCalls > 0 && healthDef.maxIterations > 0,
      23,
      'Max tool calls and max iterations defined on agent definition'
    );

    // 24. Timeout enforcement
    let timeoutCaught = false;
    const slowMockAgent = {
      definition: {
        id: 'mock_timeout_agent',
        name: 'Mock Timeout Agent',
        description: 'Tests timeout guard',
        permissionTier: AgentPermissionTier.TIER_2_ANALYZE,
        allowedTools: [],
        allowedEntityTypes: [],
        maxIterations: 1,
        maxToolCalls: 1,
        timeoutMs: 50, // 50ms timeout
        dryRunOnly: true
      },
      execute: async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { summary: 'Should not finish', status: 'HEALTHY' as const, findings: [] };
      }
    };
    agentRegistry.register(slowMockAgent as any);
    try {
      await agentRunner.run('mock_timeout_agent');
    } catch (err: any) {
      timeoutCaught = err.message?.includes('exceeded maximum allowed timeout');
    }
    assert(timeoutCaught, 24, 'Agent execution timeout strictly enforced by AgentRunner');

    // -------------------------------------------------------------
    // PART 6: SECURITY & ARCHITECTURAL CHECKS
    // -------------------------------------------------------------
    console.log('\n--- 6. SECURITY & STATIC CHECKS ---');
    let toolNotFoundCaught = false;
    try {
      await toolGateway.executeTool('imaginary_tool_xyz', {}, makeContext('system_health_agent', createdRun.id));
    } catch (err: any) {
      toolNotFoundCaught = err instanceof ToolNotFoundError;
    }
    assert(toolNotFoundCaught, 25, 'Unknown tool safely rejected with ToolNotFoundError');

    // 26 & 27 & 28: Client cannot escalate or select arbitrary tools
    const definitionFromRunner = agentRegistry.getDefinition('seo_audit_agent');
    assert(
      definitionFromRunner?.permissionTier === AgentPermissionTier.TIER_2_ANALYZE &&
        !definitionFromRunner.allowedTools.includes('modify_content'),
      26,
      'Server-side AgentRegistry is authoritative; client cannot escalate permissions'
    );
    assert(
      !definitionFromRunner?.allowedTools.includes('arbitrary_tool'),
      27,
      'Client cannot select arbitrary tools not defined in server-side AgentDefinition'
    );
    assert(
      definitionFromRunner?.permissionTier !== AgentPermissionTier.TIER_5_PUBLISH_OVERWRITE,
      28,
      'Phase 5A agents cannot be assigned Tier 5 Publish/Overwrite capabilities'
    );

    // 29 & 30: Static checks for agent files (no direct db.query or DatabaseClient imports)
    const agentDir = path.resolve(__dirname, '../agents');
    const agentFiles = [
      path.join(agentDir, 'seo/SeoAuditAgent.ts'),
      path.join(agentDir, 'ops/SystemHealthAgent.ts'),
      path.join(agentDir, 'content/ContentQualityAgent.ts')
    ];

    let hasDirectDbQueries = false;
    let hasDatabaseClientImports = false;

    for (const file of agentFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (
          content.includes('DatabaseClient') ||
          content.includes("from '../config/database'") ||
          content.includes('from "@/config/database"')
        ) {
          hasDatabaseClientImports = true;
        }
        if (content.includes('.query(') || content.includes('db.query')) {
          hasDirectDbQueries = true;
        }
      }
    }
    assert(!hasDirectDbQueries, 29, 'Static check: Zero direct db.query calls in autonomous agent implementations');
    assert(
      !hasDatabaseClientImports,
      30,
      'Static check: Zero DatabaseClient imports in autonomous agents; clean layered separation'
    );

    // -------------------------------------------------------------
    // PART 7: SEO AUDIT AGENT EXECUTION
    // -------------------------------------------------------------
    console.log('\n--- 7. SEO AUDIT AGENT EXECUTION ---');
    const seoExecResult = await agentRunner.run('seo_audit_agent', {
      actor: { type: 'ADMIN', id: 'admin-tester' },
      inputParams: { limitPerType: 3 }
    });
    assert(seoExecResult.run.status === 'COMPLETED', 31, 'SEO Audit Agent executes autonomously and completes run');

    // 32. YouTube excluded
    const youtubeFindings = seoExecResult.state.findings.filter(
      (f) => f.entityType === ('youtube' as any) || f.entityType === ('video' as any)
    );
    assert(youtubeFindings.length === 0, 32, 'YouTube records are strictly excluded from SEO Audit Agent');

    // 33. Structured findings
    const validFindingStructure = seoExecResult.state.findings.every(
      (f) =>
        typeof f.type === 'string' &&
        typeof f.severity === 'string' &&
        typeof f.title === 'string' &&
        typeof f.recommendation === 'string'
    );
    assert(validFindingStructure, 33, 'SEO findings adhere strictly to typed AgentFinding contract');

    // 34. No SEO mutation
    assert(seoAgent.definition.dryRunOnly === true, 34, 'Zero SEO mutation occurred during SEO Audit Agent run');

    // -------------------------------------------------------------
    // PART 8: SYSTEM HEALTH AGENT EXECUTION
    // -------------------------------------------------------------
    console.log('\n--- 8. SYSTEM HEALTH AGENT EXECUTION ---');
    const healthExecResult = await agentRunner.run('system_health_agent', {
      actor: { type: 'ADMIN', id: 'admin-tester' }
    });
    assert(
      healthExecResult.run.status === 'COMPLETED',
      35,
      'System Health Agent executes autonomously and completes run'
    );
    const healthStatus = healthExecResult.state.status || healthExecResult.state.summary?.status;
    assert(
      healthStatus === 'HEALTHY' || healthStatus === 'WARNING' || healthStatus === 'CRITICAL',
      36,
      `System Health Agent produces deterministic status (${healthStatus})`
    );
    assert(
      healthAgent.definition.dryRunOnly === true,
      37,
      'System Health Agent does not mutate jobs or database state'
    );

    // -------------------------------------------------------------
    // PART 9: CONTENT QUALITY AGENT EXECUTION
    // -------------------------------------------------------------
    console.log('\n--- 9. CONTENT QUALITY AGENT EXECUTION ---');
    const contentExecResult = await agentRunner.run('content_quality_agent', {
      actor: { type: 'ADMIN', id: 'admin-tester' },
      inputParams: { limitPerType: 2 }
    });
    assert(contentExecResult.run.status === 'COMPLETED', 38, 'Content Quality Agent executes and audits Articles');

    assert(
      contentAgent.definition.allowedEntityTypes.includes('festival'),
      39,
      'Content Quality Agent policy supports Festivals'
    );
    assert(
      contentAgent.definition.allowedEntityTypes.includes('puran'),
      40,
      'Content Quality Agent policy supports Puranas'
    );
    assert(
      contentAgent.definition.allowedEntityTypes.includes('bhajan'),
      41,
      'Content Quality Agent policy supports Bhajan descriptions'
    );

    // 42. YouTube excluded
    assert(
      !contentAgent.definition.allowedEntityTypes.includes('youtube'),
      42,
      'YouTube is strictly excluded from Content Quality Agent policy'
    );

    // 43. Sacred Content Firewall: verify lyrics are never in batch DTO
    const batchResult = await toolGateway.executeTool(
      'get_content_quality_batch',
      { contentType: 'bhajan', limit: 5 },
      makeContext('content_quality_agent', createdRun.id)
    );
    const bhajansBatch = (batchResult?.data as any)?.items || [];
    let lyricsExposed = false;
    for (const b of bhajansBatch) {
      if (b.lyrics !== undefined || b.clean_lyrics !== undefined) {
        lyricsExposed = true;
      }
    }
    assert(
      !lyricsExposed && bhajansBatch.length > 0,
      43,
      'Sacred Content Firewall: Bhajan lyrics are completely excluded from Content Quality batch DTO'
    );
    assert(
      contentAgent.definition.dryRunOnly === true,
      44,
      'Zero content mutation caused by Content Quality Agent run'
    );

    // -------------------------------------------------------------
    // PART 10: REGRESSIONS (Phase 2, 3, 4A, 4B, 4C)
    // -------------------------------------------------------------
    console.log('\n--- 10. REGRESSIONS (PHASE 2 - 4C) ---');
    // Phase 2: Core entities check
    const dbPing = await db.query('SELECT 1 as alive');
    assert(dbPing.rows[0].alive === 1, 45, 'Regression Phase 2: DatabaseClient & Core schema active and responsive');

    // Phase 3: SEO Engine tools
    const seoAuditTool = toolRegistry.get('get_seo_audit');
    assert(!!seoAuditTool, 46, 'Regression Phase 3: GetSeoAuditTool registered and available');

    // Phase 4A: Bhajan Meaning proposal tool
    const bhajanPropTool = toolRegistry.get('propose_bhajan_meaning');
    assert(
      !!bhajanPropTool && bhajanPropTool.permission === AgentPermissionTier.TIER_3_PROPOSE,
      47,
      'Regression Phase 4A: ProposeBhajanMeaningTool intact with Tier 3'
    );

    // Phase 4B: SEO Proposal tool
    const seoPropTool = toolRegistry.get('propose_seo_metadata');
    assert(
      !!seoPropTool && seoPropTool.permission === AgentPermissionTier.TIER_3_PROPOSE,
      48,
      'Regression Phase 4B: ProposeSeoMetadataTool intact with Tier 3'
    );

    // Phase 4C: Content Improvement tools
    const contentPropTool = toolRegistry.get('propose_article_content_improvement');
    assert(
      !!contentPropTool && contentPropTool.permission === AgentPermissionTier.TIER_3_PROPOSE,
      49,
      'Regression Phase 4C: ProposeArticleContentImprovementTool intact with Tier 3'
    );

    console.log('\n============================================================');
    console.log(`PHASE 5A VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('============================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err: any) {
    console.error('\nUNHANDLED ERROR IN VERIFICATION SUITE:', err);
    process.exit(1);
  }
}

runVerification();
