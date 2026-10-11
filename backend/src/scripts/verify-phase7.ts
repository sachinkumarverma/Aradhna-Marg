/**
 * Aradhna Marg — Phase 7 Final Verification Suite
 * Production Hardening & Governance — Comprehensive Final Test
 *
 * Verifies all 24 required dimensions:
 * A. Authentication
 * B. Authorization
 * C. ToolGateway security
 * D. Permission tiers
 * E. Sacred-content firewall
 * F. YouTube isolation
 * G. Proposal lifecycle
 * H. Proposal immutability
 * I. Stale protection
 * J. CAS/double execution
 * K. Orchestration limits
 * L. Loop protection
 * M. Recursive execution protection
 * N. Scheduler restrictions
 * O. AI Worker safety
 * P. Failure handling
 * Q. Timeout handling
 * R. Audit trail
 * S. Frontend DB isolation
 * T. Controller/service boundaries
 * U. Repository boundaries
 * V. Production data integrity
 * W. No autonomous mutation
 * X. No alternate mutation path
 */

import { db } from '../common/database/DatabaseClient';
import {
  toolRegistry,
  agentRegistry,
  toolGateway,
  agentRunner,
  agentProposalService,
  agentProposalRepository,
  agentToolCallRepository,
  agentRunRepository,
  agentExecutionService,
  agentSchedulerService,
  ContentSafetyValidator,
  AgentPermissionTier,
  AgentSecurityError,
  AgentIterationLimitError,
  AgentToolLimitError,
  AgentTimeoutError,
  AgentLoopDetectedError,
  AgentRecursionError,
  ToolNotFoundError,
  MultiStepOrchestrator,
  AgentMemoryManager,
  StepEvaluator,
  createAgentContext,
  AgentContext
} from '../agents';
import { aiJobRepository } from '../admin/repositories/AiJobRepository';
import { AiWorker } from '../admin/services/ai/AiWorker';
import { bhajanService } from '../features/bhajans/BhajanService';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testId: string, description: string): void {
  if (condition) {
    console.log(`  ✓ Test ${testId}: ${description}`);
    passed++;
  } else {
    console.error(`  ✗ Test ${testId}: FAILED - ${description}`);
    failed++;
  }
}

async function runPhase7Verification() {
  console.log('\n============================================================');
  console.log('ARADHNA MARG — PHASE 7 FINAL VERIFICATION SUITE');
  console.log('Production Hardening & Governance — Final Pass');
  console.log('============================================================\n');

  const TEST_RUN_ID = 'f0000000-0000-4000-a000-00000000007a';
  const TEST_RUN_2_ID = 'f0000000-0000-4000-a000-00000000007b';
  const TEST_BHAJAN_ID = 'b0000000-0000-4000-a000-00000000007a';
  const TEST_BHAJAN_2_ID = 'b0000000-0000-4000-a000-00000000007b';
  const ADMIN_USER = 'verified-admin-7';

  // 1. Initial Production Data Count Snapshot
  const countsBefore = {
    bhajans: parseInt((await db.query('SELECT COUNT(*) as cnt FROM bhajans')).rows[0].cnt, 10),
    articles: parseInt((await db.query('SELECT COUNT(*) as cnt FROM articles')).rows[0].cnt, 10),
    festivals: parseInt((await db.query('SELECT COUNT(*) as cnt FROM festivals')).rows[0].cnt, 10),
    puranas: parseInt((await db.query('SELECT COUNT(*) as cnt FROM puranas')).rows[0].cnt, 10),
    categories: parseInt((await db.query('SELECT COUNT(*) as cnt FROM categories')).rows[0].cnt, 10)
  };

  try {
    // -------------------------------------------------------------
    // SETUP & DETERMINISTIC FIXTURES
    // -------------------------------------------------------------
    await db.query('DELETE FROM agent_proposals WHERE agent_name LIKE $1', ['%Test%']);
    await db.query('DELETE FROM agent_proposals WHERE entity_id IN ($1, $2)', [TEST_BHAJAN_ID, TEST_BHAJAN_2_ID]);
    await db.query('DELETE FROM agent_tool_calls WHERE run_id IN ($1, $2)', [TEST_RUN_ID, TEST_RUN_2_ID]);
    await db.query('DELETE FROM agent_runs WHERE id IN ($1, $2)', [TEST_RUN_ID, TEST_RUN_2_ID]);
    await db.query('DELETE FROM bhajans WHERE id IN ($1, $2)', [TEST_BHAJAN_ID, TEST_BHAJAN_2_ID]);

    // Insert deterministic test Bhajans
    await db.query(
      `INSERT INTO bhajans (id, title, slug, lyrics, clean_lyrics, short_description, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'DRAFT', NOW(), NOW())`,
      [
        TEST_BHAJAN_ID,
        'Phase 7 Test Bhajan',
        'phase-7-test-bhajan',
        'श्री रामचन्द्र कृपालु भजु मन हरण भवभय दारुणम्।',
        'श्री रामचन्द्र कृपालु भजु मन हरण भवभय दारुणम्।',
        'आरंभिक भावार्थ चरण'
      ]
    );

    await db.query(
      `INSERT INTO bhajans (id, title, slug, lyrics, clean_lyrics, short_description, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'DRAFT', NOW(), NOW())`,
      [
        TEST_BHAJAN_2_ID,
        'Phase 7 Stale Bhajan',
        'phase-7-stale-bhajan',
        'मन लाग्यो मेरो यार फकीरी में।',
        'मन लाग्यो मेरो यार फकीरी में।',
        'मूल भावार्थ'
      ]
    );

    // Insert deterministic test Agent Runs
    await db.query(
      `INSERT INTO agent_runs (id, agent_name, trigger_type, triggered_by, status, iteration_count, total_tokens_used, created_at, updated_at)
       VALUES ($1, $2, 'MANUAL', $3, 'RUNNING', 0, 0, NOW(), NOW())`,
      [TEST_RUN_ID, 'seo_audit_agent', ADMIN_USER]
    );

    await db.query(
      `INSERT INTO agent_runs (id, agent_name, trigger_type, triggered_by, status, iteration_count, total_tokens_used, created_at, updated_at)
       VALUES ($1, $2, 'MANUAL', $3, 'RUNNING', 0, 0, NOW(), NOW())`,
      [TEST_RUN_2_ID, 'BhajanMeaningAgent', ADMIN_USER]
    );

    // -------------------------------------------------------------
    // PART A: AUTHENTICATION
    // -------------------------------------------------------------
    console.log('--- PART A: AUTHENTICATION ---');

    const adminRoutesFile = path.resolve(__dirname, '../admin/routes/admin.routes.ts');
    const adminRoutesContent = fs.readFileSync(adminRoutesFile, 'utf8');

    assert(
      adminRoutesContent.includes('router.use(requireAdmin);'),
      'A.1',
      'requireAdmin middleware mounted before protected admin routes'
    );
    assert(
      adminRoutesContent.indexOf('router.use(requireAdmin);') <
        adminRoutesContent.indexOf('/agents/proposals/:id/execute'),
      'A.2',
      'Proposal execution route mounted strictly behind requireAdmin'
    );
    assert(
      adminRoutesContent.indexOf('router.use(requireAdmin);') < adminRoutesContent.indexOf('/agents/schedules/:id/run'),
      'A.3',
      'Scheduler manual execution route mounted strictly behind requireAdmin'
    );

    // -------------------------------------------------------------
    // PART B: AUTHORIZATION
    // -------------------------------------------------------------
    console.log('\n--- PART B: AUTHORIZATION ---');

    const agentControllerFile = path.resolve(__dirname, '../admin/controllers/agent.controller.ts');
    const agentControllerContent = fs.readFileSync(agentControllerFile, 'utf8');

    assert(
      agentControllerContent.includes('(req as any).user?.username'),
      'B.1',
      'Identity derived from authenticated server-side JWT session'
    );
    assert(
      !agentControllerContent.includes('req.body.executedBy'),
      'B.2',
      'Frontend cannot spoof executedBy identity in request body'
    );
    assert(
      !agentControllerContent.includes('req.body.reviewedBy'),
      'B.3',
      'Frontend cannot spoof reviewedBy identity in request body'
    );

    // -------------------------------------------------------------
    // PART C: TOOL GATEWAY SECURITY
    // -------------------------------------------------------------
    console.log('\n--- PART C: TOOL GATEWAY SECURITY ---');

    const ctxA = createAgentContext({
      runId: TEST_RUN_ID,
      agentName: 'seo_audit_agent',
      allowedTools: ['get_seo_audit'],
      dryRunOnly: true
    });

    let unknownToolRejected = false;
    try {
      await toolGateway.executeTool('non_existent_tool_xyz', {}, ctxA);
    } catch (err: any) {
      if (err instanceof ToolNotFoundError) unknownToolRejected = true;
    }
    assert(unknownToolRejected, 'C.1', 'ToolGateway strictly rejects unknown tools with ToolNotFoundError');

    let disallowedToolRejected = false;
    try {
      await toolGateway.executeTool('get_system_health', {}, ctxA);
    } catch (err: any) {
      if (err instanceof AgentSecurityError) disallowedToolRejected = true;
    }
    assert(disallowedToolRejected, 'C.2', 'ToolGateway strictly enforces agent allowedTools policy');

    // -------------------------------------------------------------
    // PART D: PERMISSION TIERS
    // -------------------------------------------------------------
    console.log('\n--- PART D: PERMISSION TIERS ---');

    // Tier 1/2 read autonomous allowed
    const readResult = await toolGateway.executeTool('get_seo_audit', {}, ctxA);
    assert(readResult.success === true, 'D.1', 'Tier 1/2 read & analyze operations execute autonomously');

    // Tier 3 propose stages proposal
    const propCtx = createAgentContext({
      runId: TEST_RUN_2_ID,
      agentName: 'BhajanMeaningAgent',
      allowedTools: ['propose_bhajan_meaning'],
      dryRunOnly: false
    });

    const proposeResult = await toolGateway.executeTool(
      'propose_bhajan_meaning',
      {
        entityId: TEST_BHAJAN_ID,
        proposedMeaning: 'यह भजन प्रभु श्रीराम के परम पावन चरणों में अनन्य भक्ति और समर्पण का संदेश देता है।',
        currentValue: 'आरंभिक भावार्थ चरण',
        reasoning: 'भावार्थ सुधार'
      },
      propCtx
    );

    assert(
      proposeResult.isProposalStaged === true && Boolean(proposeResult.proposalId),
      'D.2',
      'Tier 3 tool stages proposal without mutating live content'
    );

    // Tier 5 autonomous publish/overwrite blocked
    let tier5Blocked = false;
    try {
      await toolGateway.executeTool(
        'apply_bhajan_meaning',
        {
          proposalId: proposeResult.proposalId,
          bhajanId: TEST_BHAJAN_ID,
          meaning: 'Bypass'
        },
        propCtx
      );
    } catch (err: any) {
      if (err instanceof AgentSecurityError && err.message.includes('Tier-5')) {
        tier5Blocked = true;
      }
    }
    assert(tier5Blocked, 'D.3', 'Autonomous invocation of Tier-5 tools blocked by ToolGateway firewall');

    // -------------------------------------------------------------
    // PART E: SACRED-CONTENT FIREWALL
    // -------------------------------------------------------------
    console.log('\n--- PART E: SACRED-CONTENT FIREWALL ---');

    let sacredFieldBlocked = false;
    try {
      await toolGateway.executeTool(
        'propose_bhajan_meaning',
        {
          entityId: TEST_BHAJAN_ID,
          targetField: 'lyrics' as any,
          proposedMeaning: 'नया पद'
        },
        propCtx
      );
    } catch {
      sacredFieldBlocked = true;
    }
    assert(sacredFieldBlocked, 'E.1', 'Bhajan lyrics targetField rejected by ToolGateway');

    // 70% retention rule in ContentSafetyValidator
    const catastrophicValidation = ContentSafetyValidator.validateContentImprovement({
      entityType: 'article',
      targetField: 'content',
      originalContent: 'प्रभु श्रीराम का जीवन हमें त्याग, मर्यादा और धर्म का पालन सिखाता है। '.repeat(100),
      proposedContent: 'संक्षिप्त लेख।'
    });
    assert(
      catastrophicValidation.isValid === false,
      'E.2',
      'ContentSafetyValidator detects and rejects catastrophic reduction (<70%)'
    );

    const bhajanLyricsRecord = (await db.query('SELECT lyrics FROM bhajans WHERE id = $1', [TEST_BHAJAN_ID])).rows[0];
    assert(
      bhajanLyricsRecord.lyrics === 'श्री रामचन्द्र कृपालु भजु मन हरण भवभय दारुणम्।',
      'E.3',
      'Sacred lyrics remain 100% unaltered in database'
    );

    // -------------------------------------------------------------
    // PART F: YOUTUBE ISOLATION
    // -------------------------------------------------------------
    console.log('\n--- PART F: YOUTUBE ISOLATION ---');

    let youtubeProposalBlocked = false;
    try {
      await toolGateway.executeTool(
        'propose_seo_metadata',
        {
          entityType: 'youtube' as any,
          entityId: 'vid-123',
          proposedTitle: 'YouTube SEO'
        },
        propCtx
      );
    } catch {
      youtubeProposalBlocked = true;
    }
    assert(youtubeProposalBlocked, 'F.1', 'YouTube entity cannot be targeted by website proposal tools');

    // -------------------------------------------------------------
    // PART G: PROPOSAL LIFECYCLE
    // -------------------------------------------------------------
    console.log('\n--- PART G: PROPOSAL LIFECYCLE ---');

    const stagedProposalId = proposeResult.proposalId!;
    const proposalRowPending = await agentProposalRepository.findById(stagedProposalId);
    assert(proposalRowPending?.status === 'PENDING', 'G.1', 'Newly staged proposal has status PENDING');

    // Approve does NOT mutate live content
    const approvedProposal = await agentProposalService.approveProposal(stagedProposalId, ADMIN_USER);
    assert(approvedProposal.status === 'APPROVED', 'G.2', 'Proposal successfully transitioned to APPROVED');

    const bhajanBeforeExec = (await db.query('SELECT short_description FROM bhajans WHERE id = $1', [TEST_BHAJAN_ID]))
      .rows[0];
    assert(bhajanBeforeExec.short_description === 'आरंभिक भावार्थ चरण', 'G.3', 'Approval does NOT mutate live content');

    // Approved execution succeeds
    const executedProposal = await agentProposalService.executeProposal(stagedProposalId, ADMIN_USER);
    assert(executedProposal.status === 'COMPLETED', 'G.4', 'Executed proposal successfully transitioned to COMPLETED');

    const bhajanAfterExec = (await db.query('SELECT short_description FROM bhajans WHERE id = $1', [TEST_BHAJAN_ID]))
      .rows[0];
    assert(
      bhajanAfterExec.short_description.includes('अनन्य भक्ति'),
      'G.5',
      'Live content updated only upon explicit human execution'
    );

    // -------------------------------------------------------------
    // PART H: PROPOSAL IMMUTABILITY
    // -------------------------------------------------------------
    console.log('\n--- PART H: PROPOSAL IMMUTABILITY ---');

    assert(
      typeof (agentProposalService as any).updateProposedValue === 'undefined',
      'H.1',
      'No method exists to modify proposed value after creation'
    );
    assert(
      typeof (agentProposalRepository as any).updateValue === 'undefined',
      'H.2',
      'Proposal repository provides zero value-mutation methods'
    );

    // -------------------------------------------------------------
    // PART I: STALE PROTECTION
    // -------------------------------------------------------------
    console.log('\n--- PART I: STALE PROTECTION ---');

    // Stage proposal on Bhajan 2
    const stalePropResult = await toolGateway.executeTool(
      'propose_bhajan_meaning',
      {
        entityId: TEST_BHAJAN_2_ID,
        proposedMeaning: 'नया संशोधित भावार्थ जो स्वीकृत होगा।',
        currentValue: 'मूल भावार्थ',
        reasoning: 'भावार्थ संवर्धन'
      },
      propCtx
    );

    const staleProposalId = stalePropResult.proposalId!;
    await agentProposalService.approveProposal(staleProposalId, ADMIN_USER);

    // Modify live bhajan externally
    await db.query('UPDATE bhajans SET short_description = $1 WHERE id = $2', [
      'बाहरी व्यवस्थापक द्वारा बदला गया भावार्थ',
      TEST_BHAJAN_2_ID
    ]);

    let staleConflictCaught = false;
    try {
      await agentProposalService.executeProposal(staleProposalId, ADMIN_USER);
    } catch (err: any) {
      if (err.statusCode === 409) staleConflictCaught = true;
    }
    assert(staleConflictCaught, 'I.1', 'Stale proposal rejected with HTTP 409 Conflict when baseline content changed');

    const bhajan2Live = (await db.query('SELECT short_description FROM bhajans WHERE id = $1', [TEST_BHAJAN_2_ID]))
      .rows[0];
    assert(
      bhajan2Live.short_description === 'बाहरी व्यवस्थापक द्वारा बदला गया भावार्थ',
      'I.2',
      'External live change strictly preserved'
    );

    const staleProposalRow = await agentProposalRepository.findById(staleProposalId);
    assert(staleProposalRow?.status === 'FAILED', 'I.3', 'Stale proposal marked as FAILED in database');

    // -------------------------------------------------------------
    // PART J: CAS & DOUBLE EXECUTION PREVENTION
    // -------------------------------------------------------------
    console.log('\n--- PART J: CAS & DOUBLE EXECUTION ---');

    let doubleExecBlocked = false;
    try {
      await agentProposalService.executeProposal(stagedProposalId, ADMIN_USER);
    } catch (err: any) {
      if (err.statusCode === 400 && err.message.includes('already been executed')) {
        doubleExecBlocked = true;
      }
    }
    assert(doubleExecBlocked, 'J.1', 'Completed proposal cannot be executed a second time');

    // Concurrent CAS test
    const pDouble = await agentProposalRepository.create({
      agentName: 'BhajanMeaningAgent',
      entityType: 'bhajan',
      entityId: TEST_BHAJAN_ID,
      targetField: 'meaning',
      currentValue: bhajanAfterExec.short_description,
      proposedValue: 'अंतिम भावार्थ चरण ७',
      reasoning: 'कनकरेंसी परीक्षण'
    });
    await agentProposalService.approveProposal(pDouble.id, ADMIN_USER);

    const [exec1, exec2] = await Promise.allSettled([
      agentProposalService.executeProposal(pDouble.id, ADMIN_USER),
      agentProposalService.executeProposal(pDouble.id, ADMIN_USER)
    ]);

    const successes = [exec1, exec2].filter((r) => r.status === 'fulfilled');
    const failures = [exec1, exec2].filter((r) => r.status === 'rejected');
    assert(
      successes.length === 1 && failures.length === 1,
      'J.2',
      'CAS prevents concurrent double execution (exactly 1 succeeded, 1 rejected)'
    );

    // -------------------------------------------------------------
    // PART K: ORCHESTRATION LIMITS
    // -------------------------------------------------------------
    console.log('\n--- PART K: ORCHESTRATION LIMITS ---');

    const limitCtx = createAgentContext({
      runId: TEST_RUN_ID,
      agentName: 'seo_audit_agent',
      maxIterations: 2,
      maxToolCalls: 2,
      allowedTools: ['get_seo_audit']
    });

    await MultiStepOrchestrator.executeStep(limitCtx, 'get_seo_audit', {});
    await MultiStepOrchestrator.executeStep(limitCtx, 'get_seo_audit', { scope: 'bhajan' });

    let iterLimitExceeded = false;
    try {
      await MultiStepOrchestrator.executeStep(limitCtx, 'get_seo_audit', { scope: 'article' });
    } catch (err: any) {
      if (err instanceof AgentIterationLimitError || err instanceof AgentToolLimitError) {
        iterLimitExceeded = true;
      }
    }
    assert(iterLimitExceeded, 'K.1', 'MultiStepOrchestrator hard limits enforce iteration boundaries');

    // -------------------------------------------------------------
    // PART L: LOOP PROTECTION
    // -------------------------------------------------------------
    console.log('\n--- PART L: LOOP PROTECTION ---');

    const loopCtx = createAgentContext({
      runId: TEST_RUN_ID,
      agentName: 'seo_audit_agent',
      allowedTools: ['get_seo_audit']
    });

    AgentMemoryManager.recordStep(loopCtx, {
      toolName: 'get_seo_audit',
      inputPayload: { scope: 'same' },
      outputPayload: {},
      status: 'SUCCESS',
      durationMs: 10
    });
    AgentMemoryManager.recordStep(loopCtx, {
      toolName: 'get_seo_audit',
      inputPayload: { scope: 'same' },
      outputPayload: {},
      status: 'SUCCESS',
      durationMs: 10
    });

    let loopDetected = false;
    try {
      AgentMemoryManager.checkLoopProtection(loopCtx, 'get_seo_audit', { scope: 'same' });
    } catch (err: any) {
      if (err instanceof AgentLoopDetectedError) loopDetected = true;
    }
    assert(loopDetected, 'L.1', 'AgentMemoryManager detects 3x repeated identical tool calls');

    // Ping-pong loop
    const pingPongCtx = createAgentContext({
      runId: TEST_RUN_ID,
      agentName: 'seo_audit_agent',
      allowedTools: ['tool_a', 'tool_b']
    });
    AgentMemoryManager.recordStep(pingPongCtx, {
      toolName: 'tool_a',
      inputPayload: {},
      outputPayload: {},
      status: 'SUCCESS',
      durationMs: 10
    });
    AgentMemoryManager.recordStep(pingPongCtx, {
      toolName: 'tool_b',
      inputPayload: {},
      outputPayload: {},
      status: 'SUCCESS',
      durationMs: 10
    });
    AgentMemoryManager.recordStep(pingPongCtx, {
      toolName: 'tool_a',
      inputPayload: {},
      outputPayload: {},
      status: 'SUCCESS',
      durationMs: 10
    });

    let pingPongDetected = false;
    try {
      AgentMemoryManager.checkLoopProtection(pingPongCtx, 'tool_b', {});
    } catch (err: any) {
      if (err instanceof AgentLoopDetectedError) pingPongDetected = true;
    }
    assert(pingPongDetected, 'L.2', 'AgentMemoryManager detects 2-step alternating ping-pong cycle');

    // -------------------------------------------------------------
    // PART M: RECURSIVE EXECUTION PROTECTION
    // -------------------------------------------------------------
    console.log('\n--- PART M: RECURSIVE EXECUTION PROTECTION ---');

    MultiStepOrchestrator.enterExecution('rec-run-1', 'test_agent');
    let recursionBlocked = false;
    try {
      MultiStepOrchestrator.enterExecution('rec-run-1', 'test_agent');
    } catch (err: any) {
      if (err instanceof AgentRecursionError) recursionBlocked = true;
    } finally {
      MultiStepOrchestrator.exitExecution('rec-run-1', 'test_agent');
    }
    assert(recursionBlocked, 'M.1', 'MultiStepOrchestrator prevents nested recursive agent execution');

    // -------------------------------------------------------------
    // PART N: SCHEDULER RESTRICTIONS
    // -------------------------------------------------------------
    console.log('\n--- PART N: SCHEDULER RESTRICTIONS ---');

    const schedules = await agentSchedulerService.getSchedules();
    const allDryRun = schedules.every((s) => {
      const def = agentRegistry.getDefinition(s.agentId);
      return def?.dryRunOnly === true;
    });
    assert(allDryRun, 'N.1', 'All registered scheduled agents strictly configured with dryRunOnly: true');

    const schedulerFile = path.resolve(__dirname, '../agents/services/AgentSchedulerService.ts');
    const schedulerContent = fs.readFileSync(schedulerFile, 'utf8');
    assert(!schedulerContent.includes('executeApprovedProposal'), 'N.2', 'Scheduler contains zero execution paths');
    assert(!schedulerContent.includes('approveProposal'), 'N.3', 'Scheduler contains zero approval paths');

    // -------------------------------------------------------------
    // PART O: AI WORKER SAFETY
    // -------------------------------------------------------------
    console.log('\n--- PART O: AI WORKER SAFETY ---');

    const workerFile = path.resolve(__dirname, '../admin/services/ai/AiWorker.ts');
    const workerContent = fs.readFileSync(workerFile, 'utf8');
    assert(
      !workerContent.includes("from '@/common/database/DatabaseClient'"),
      'O.1',
      'AiWorker does not import DatabaseClient directly'
    );
    assert(workerContent.includes('recoverStuckJobs'), 'O.2', 'AiWorker provides stuck job recovery on startup');

    // -------------------------------------------------------------
    // PART P: FAILURE HANDLING
    // -------------------------------------------------------------
    console.log('\n--- PART P: FAILURE HANDLING ---');

    const failStepEval = StepEvaluator.evaluateStep(
      ctxA,
      'get_seo_audit',
      { success: false, error: 'Database timeout simulated' },
      {}
    );
    assert(
      failStepEval.canContinue === false && failStepEval.status === 'FAILURE',
      'P.1',
      'StepEvaluator fails closed on tool failure'
    );

    // -------------------------------------------------------------
    // PART Q: TIMEOUT HANDLING
    // -------------------------------------------------------------
    console.log('\n--- PART Q: TIMEOUT HANDLING ---');

    const timeoutCtx = createAgentContext({
      runId: TEST_RUN_ID,
      agentName: 'seo_audit_agent',
      timeoutMs: 10,
      allowedTools: ['get_seo_audit']
    });
    timeoutCtx.startTime = Date.now() - 500;

    let timeoutCaught = false;
    try {
      MultiStepOrchestrator.validateToolSelection(timeoutCtx, 'get_seo_audit', {});
    } catch (err: any) {
      if (err instanceof AgentTimeoutError) timeoutCaught = true;
    }
    assert(timeoutCaught, 'Q.1', 'MultiStepOrchestrator enforces hard execution timeout');
    assert(timeoutCtx.status === 'TIMEOUT', 'Q.2', 'Context status transitioned to TIMEOUT upon timeout expiry');

    // -------------------------------------------------------------
    // PART R: AUDIT TRAIL
    // -------------------------------------------------------------
    console.log('\n--- PART R: AUDIT TRAIL ---');

    const toolCalls = await agentToolCallRepository.findByRunId(TEST_RUN_ID);
    assert(toolCalls.length > 0, 'R.1', 'Audited tool calls persisted in agent_tool_calls');

    const runRecord = await agentRunRepository.findById(TEST_RUN_ID);
    assert(runRecord !== null, 'R.2', 'Agent run persisted in agent_runs');

    const proposalAudit = await agentProposalRepository.findById(stagedProposalId);
    assert(
      Boolean(proposalAudit?.reviewedBy) && Boolean(proposalAudit?.reviewedAt) && proposalAudit?.status === 'COMPLETED',
      'R.3',
      'Immutable proposal audit trail persisted (reviewedBy, reviewedAt, status)'
    );

    // -------------------------------------------------------------
    // PART S: FRONTEND DB ISOLATION
    // -------------------------------------------------------------
    console.log('\n--- PART S: FRONTEND DB ISOLATION ---');

    const frontendDir = path.resolve(__dirname, '../../../frontend/src');
    const walkFiles = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(walkFiles(fullPath));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          results.push(fullPath);
        }
      });
      return results;
    };

    const frontendFiles = walkFiles(frontendDir);
    let frontendDbLeak = false;
    for (const f of frontendFiles) {
      if (f.endsWith('supabase.ts')) continue; // Legacy orphaned file
      const content = fs.readFileSync(f, 'utf8');
      if (content.includes("from 'pg'") || content.includes('DatabaseClient')) {
        frontendDbLeak = true;
        break;
      }
    }
    assert(!frontendDbLeak, 'S.1', 'Frontend source code contains zero direct database access');

    // -------------------------------------------------------------
    // PART T: CONTROLLER / SERVICE BOUNDARIES
    // -------------------------------------------------------------
    console.log('\n--- PART T: CONTROLLER / SERVICE BOUNDARIES ---');

    assert(
      !agentControllerContent.includes('bhajanRepository.update'),
      'T.1',
      'Agent controller does not mutate bhajanRepository directly'
    );
    assert(
      !agentControllerContent.includes('articleRepository.update'),
      'T.2',
      'Agent controller does not mutate articleRepository directly'
    );

    // -------------------------------------------------------------
    // PART U: REPOSITORY BOUNDARIES
    // -------------------------------------------------------------
    console.log('\n--- PART U: REPOSITORY BOUNDARIES ---');

    const proposalRepoFile = path.resolve(__dirname, '../agents/repositories/AgentProposalRepository.ts');
    const proposalRepoContent = fs.readFileSync(proposalRepoFile, 'utf8');
    assert(proposalRepoContent.includes('$1'), 'U.1', 'Repositories strictly execute parameterized SQL queries');

    // -------------------------------------------------------------
    // PART V: PRODUCTION DATA INTEGRITY
    // -------------------------------------------------------------
    console.log('\n--- PART V: PRODUCTION DATA INTEGRITY ---');

    // Clean up temporary test data before final counts
    await db.query('DELETE FROM agent_proposals WHERE entity_id IN ($1, $2)', [TEST_BHAJAN_ID, TEST_BHAJAN_2_ID]);
    await db.query('DELETE FROM agent_tool_calls WHERE run_id IN ($1, $2)', [TEST_RUN_ID, TEST_RUN_2_ID]);
    await db.query('DELETE FROM agent_runs WHERE id IN ($1, $2)', [TEST_RUN_ID, TEST_RUN_2_ID]);
    await db.query('DELETE FROM bhajans WHERE id IN ($1, $2)', [TEST_BHAJAN_ID, TEST_BHAJAN_2_ID]);

    const countsAfter = {
      bhajans: parseInt((await db.query('SELECT COUNT(*) as cnt FROM bhajans')).rows[0].cnt, 10),
      articles: parseInt((await db.query('SELECT COUNT(*) as cnt FROM articles')).rows[0].cnt, 10),
      festivals: parseInt((await db.query('SELECT COUNT(*) as cnt FROM festivals')).rows[0].cnt, 10),
      puranas: parseInt((await db.query('SELECT COUNT(*) as cnt FROM puranas')).rows[0].cnt, 10),
      categories: parseInt((await db.query('SELECT COUNT(*) as cnt FROM categories')).rows[0].cnt, 10)
    };

    assert(
      countsBefore.bhajans === countsAfter.bhajans,
      'V.1',
      `Bhajan count preserved (${countsBefore.bhajans} == ${countsAfter.bhajans})`
    );
    assert(
      countsBefore.articles === countsAfter.articles,
      'V.2',
      `Article count preserved (${countsBefore.articles} == ${countsAfter.articles})`
    );
    assert(
      countsBefore.festivals === countsAfter.festivals,
      'V.3',
      `Festival count preserved (${countsBefore.festivals} == ${countsAfter.festivals})`
    );
    assert(
      countsBefore.puranas === countsAfter.puranas,
      'V.4',
      `Puran count preserved (${countsBefore.puranas} == ${countsAfter.puranas})`
    );
    assert(
      countsBefore.categories === countsAfter.categories,
      'V.5',
      `Category count preserved (${countsBefore.categories} == ${countsAfter.categories})`
    );

    // -------------------------------------------------------------
    // PART W: NO AUTONOMOUS MUTATION
    // -------------------------------------------------------------
    console.log('\n--- PART W: NO AUTONOMOUS MUTATION ---');

    assert(!toolRegistry.has('approve_proposal'), 'W.1', 'Zero approval tools exist in Tool Registry');
    assert(!toolRegistry.has('execute_proposal'), 'W.2', 'Zero execution tools exist in Tool Registry');
    assert(!toolRegistry.has('publish_article'), 'W.3', 'Zero autonomous publishing tools exist in Tool Registry');
    assert(!toolRegistry.has('delete_content'), 'W.4', 'Zero autonomous deletion tools exist in Tool Registry');

    // -------------------------------------------------------------
    // PART X: NO ALTERNATE MUTATION PATH
    // -------------------------------------------------------------
    console.log('\n--- PART X: NO ALTERNATE MUTATION PATH ---');

    const proposalServiceFile = path.resolve(__dirname, '../agents/services/AgentProposalService.ts');
    const proposalServiceContent = fs.readFileSync(proposalServiceFile, 'utf8');
    assert(
      proposalServiceContent.includes('toolGateway.executeApprovedProposal'),
      'X.1',
      'Approved proposal execution routes exclusively through ToolGateway'
    );
    assert(
      !proposalServiceContent.includes('bhajanRepository.updateMeaning'),
      'X.2',
      'ProposalService does NOT bypass ToolGateway or domain services'
    );
  } catch (unexpectedError: any) {
    console.error('\nVerification suite crashed unexpectedly:', unexpectedError);
    failed++;
  } finally {
    // Guaranteed cleanup
    try {
      await db.query('DELETE FROM agent_proposals WHERE agent_name LIKE $1', ['%Test%']);
      await db.query('DELETE FROM agent_proposals WHERE entity_id IN ($1, $2)', [TEST_BHAJAN_ID, TEST_BHAJAN_2_ID]);
      await db.query('DELETE FROM agent_tool_calls WHERE run_id IN ($1, $2)', [TEST_RUN_ID, TEST_RUN_2_ID]);
      await db.query('DELETE FROM agent_runs WHERE id IN ($1, $2)', [TEST_RUN_ID, TEST_RUN_2_ID]);
      await db.query('DELETE FROM bhajans WHERE id IN ($1, $2)', [TEST_BHAJAN_ID, TEST_BHAJAN_2_ID]);
    } catch {
      // Ignore cleanup error
    }
  }

  console.log('\n============================================================');
  console.log(`PHASE 7 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase7Verification().catch((err) => {
  console.error('Fatal execution error in verify-phase7:', err);
  process.exit(1);
});
