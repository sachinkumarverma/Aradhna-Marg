/**
 * Phase 6 Verification Suite
 * Agent Intelligence & Multi-Step Orchestration
 *
 * Verifies all Phase 6 constitutional and architectural requirements:
 * A. Agent context creation
 * B. Context isolation
 * C. Tool selection validation
 * D. Permission enforcement
 * E. Multi-step execution
 * F. Tool-call limits
 * G. Iteration limits
 * H. Timeout protection
 * I. Loop & cycle protection
 * J. Recursive agent protection
 * K. Evaluation & safe termination
 * L. Failed tool handling
 * M. Proposal creation integration
 * N. No autonomous approval
 * O. No autonomous execution
 * P. Tier-5 blocking
 * Q. Sacred content protection
 * R. YouTube exclusion
 * S. Scheduler read-only behavior
 * T. Audit trail
 * U. Frontend DB isolation
 * V. Controller/service/repository boundaries
 * W. Production data integrity
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
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testId: string | number, description: string): void {
  if (condition) {
    console.log(`  ✓ Test ${testId}: ${description}`);
    passed++;
  } else {
    console.error(`  ✗ Test ${testId}: FAILED - ${description}`);
    failed++;
  }
}

async function runPhase6Verification() {
  console.log('\n============================================================');
  console.log('ARADHNA MARG — PHASE 6 VERIFICATION SUITE');
  console.log('Agent Intelligence & Multi-Step Orchestration');
  console.log('============================================================\n');

  const TEST_RUN_ID = 'e0000000-0000-4000-a000-00000000006a';
  const TEST_RUN_2_ID = 'e0000000-0000-4000-a000-00000000006b';
  const TEST_BHAJAN_ID = 'b0000000-0000-4000-a000-00000000006a';
  const ADMIN_USER = 'verified-admin-6';

  // 1. Production count snapshot before test
  const countsBefore = {
    bhajans: parseInt((await db.query('SELECT COUNT(*) as cnt FROM bhajans')).rows[0].cnt, 10),
    articles: parseInt((await db.query('SELECT COUNT(*) as cnt FROM articles')).rows[0].cnt, 10),
    festivals: parseInt((await db.query('SELECT COUNT(*) as cnt FROM festivals')).rows[0].cnt, 10),
    puranas: parseInt((await db.query('SELECT COUNT(*) as cnt FROM puranas')).rows[0].cnt, 10),
    categories: parseInt((await db.query('SELECT COUNT(*) as cnt FROM categories')).rows[0].cnt, 10)
  };

  try {
    // -------------------------------------------------------------
    // CLEANUP & SETUP
    // -------------------------------------------------------------
    await db.query('DELETE FROM agent_proposals WHERE agent_name LIKE $1', ['%Test%']);
    await db.query('DELETE FROM agent_proposals WHERE entity_id = $1', [TEST_BHAJAN_ID]);
    await db.query('DELETE FROM agent_tool_calls WHERE run_id IN ($1, $2)', [TEST_RUN_ID, TEST_RUN_2_ID]);
    await db.query('DELETE FROM agent_runs WHERE id IN ($1, $2)', [TEST_RUN_ID, TEST_RUN_2_ID]);
    await db.query('DELETE FROM bhajans WHERE id = $1', [TEST_BHAJAN_ID]);

    // Insert controlled test Bhajan
    await db.query(
      `INSERT INTO bhajans (
        id, title, hindi_title, slug, lyrics, clean_lyrics, short_description, status
      ) VALUES (
        $1, 'Test Bhajan Phase 6', 'टेस्ट भजन फेज 6', 'test-bhajan-phase-6',
        'जय सिया राम जय जय सिया राम कृपा करो प्रभु कृपा निधान', 'जय सिया राम कृपा करो प्रभु',
        'प्रारंभिक भावार्थ 6', 'DRAFT'
      )`,
      [TEST_BHAJAN_ID]
    );

    // Insert test Agent Run record
    await db.query(
      `INSERT INTO agent_runs (
        id, agent_name, trigger_type, triggered_by, status, state
      ) VALUES ($1, 'seo_audit_agent', 'MANUAL', $2, 'RUNNING', '{}')`,
      [TEST_RUN_ID, ADMIN_USER]
    );

    // -------------------------------------------------------------
    // PART A: AGENT CONTEXT CREATION
    // -------------------------------------------------------------
    console.log('\n--- PART A: AGENT CONTEXT CREATION ---');

    const ctxA = createAgentContext({
      runId: TEST_RUN_ID,
      agentName: 'seo_audit_agent',
      actor: { type: 'ADMIN', id: ADMIN_USER },
      objective: 'Audit SEO metadata across public pages',
      maxIterations: 15,
      maxToolCalls: 10,
      timeoutMs: 30000,
      dryRunOnly: true,
      allowedTools: ['get_seo_audit', 'get_seo_content_batch']
    });

    assert(ctxA.runId === TEST_RUN_ID, 'A.1', 'createAgentContext correctly binds runId');
    assert(ctxA.actor.id === ADMIN_USER && ctxA.actor.type === 'ADMIN', 'A.2', 'Context binds actor identity');
    assert(ctxA.constraints?.maxIterations === 15, 'A.3', 'Context binds maxIterations constraint');
    assert(ctxA.constraints?.maxToolCalls === 10, 'A.4', 'Context binds maxToolCalls constraint');
    assert(ctxA.memory?.stepHistory.length === 0, 'A.5', 'Context initializes empty short-term memory');

    // -------------------------------------------------------------
    // PART B: CONTEXT ISOLATION
    // -------------------------------------------------------------
    console.log('\n--- PART B: CONTEXT ISOLATION ---');

    const ctxB = createAgentContext({
      runId: TEST_RUN_2_ID,
      agentName: 'system_health_agent',
      actor: { type: 'SYSTEM', id: 'system' },
      objective: 'Inspect database and worker health'
    });

    // Mutate ctxA memory and verify ctxB remains untouched
    AgentMemoryManager.recordStep(ctxA, {
      toolName: 'get_seo_audit',
      inputPayload: { scope: 'bhajan' },
      outputPayload: { total: 10 },
      status: 'SUCCESS',
      durationMs: 25
    });

    assert(ctxA.memory?.stepHistory.length === 1, 'B.1', 'ctxA records step in its own memory');
    assert(ctxB.memory?.stepHistory.length === 0, 'B.2', 'ctxB memory remains completely isolated from ctxA');
    assert(
      ctxA.currentStep === 1 && (ctxB.currentStep ?? 0) === 0,
      'B.3',
      'Step counters remain strictly isolated across contexts'
    );

    // -------------------------------------------------------------
    // PART C: TOOL SELECTION VALIDATION
    // -------------------------------------------------------------
    console.log('\n--- PART C: TOOL SELECTION VALIDATION ---');

    let unknownToolRejected = false;
    try {
      MultiStepOrchestrator.validateToolSelection(ctxA, 'non_existent_tool_xyz', {});
    } catch (err: any) {
      if (err instanceof ToolNotFoundError) unknownToolRejected = true;
    }
    assert(unknownToolRejected, 'C.1', 'Server strictly rejects unknown tool with ToolNotFoundError');

    let disallowedToolRejected = false;
    try {
      // get_system_health is not in allowedTools for seo_audit_agent
      MultiStepOrchestrator.validateToolSelection(ctxA, 'get_system_health', {});
    } catch (err: any) {
      if (err instanceof AgentSecurityError && err.message.includes('not in the allowedTools policy')) {
        disallowedToolRejected = true;
      }
    }
    assert(disallowedToolRejected, 'C.2', 'Server strictly rejects tool outside agent allowedTools policy');

    // -------------------------------------------------------------
    // PART D: PERMISSION ENFORCEMENT
    // -------------------------------------------------------------
    console.log('\n--- PART D: PERMISSION ENFORCEMENT ---');

    let tier5AutonomousBlocked = false;
    try {
      MultiStepOrchestrator.validateToolSelection(ctxA, 'apply_bhajan_meaning', {
        proposalId: 'prop-1',
        bhajanId: TEST_BHAJAN_ID,
        meaning: 'Bypass'
      });
    } catch (err: any) {
      if (err instanceof AgentSecurityError && err.message.includes('Tier-5')) {
        tier5AutonomousBlocked = true;
      }
    }
    assert(tier5AutonomousBlocked, 'D.1', 'MultiStepOrchestrator blocks autonomous Tier-5 tool selection');

    let dryRunMutationBlocked = false;
    try {
      const dryRunCtx = createAgentContext({
        runId: TEST_RUN_ID,
        agentName: 'seo_audit_agent',
        dryRunOnly: true,
        allowedTools: ['propose_seo_metadata']
      });
      MultiStepOrchestrator.validateToolSelection(dryRunCtx, 'propose_seo_metadata', {
        entityType: 'bhajan',
        entityId: TEST_BHAJAN_ID
      });
    } catch (err: any) {
      if (err instanceof AgentSecurityError && err.message.includes('dryRunOnly')) {
        dryRunMutationBlocked = true;
      }
    }
    assert(dryRunMutationBlocked, 'D.2', 'dryRunOnly agents cannot select proposal/mutation tools');

    // -------------------------------------------------------------
    // PART E: MULTI-STEP EXECUTION
    // -------------------------------------------------------------
    console.log('\n--- PART E: MULTI-STEP EXECUTION ---');

    const orchestrateCtx = createAgentContext({
      runId: TEST_RUN_ID,
      agentName: 'seo_audit_agent',
      allowedTools: ['get_seo_audit', 'get_seo_content_batch'],
      dryRunOnly: true
    });

    const planResult = await MultiStepOrchestrator.executePlan(orchestrateCtx, [
      {
        stepNumber: 1,
        description: 'Read overall SEO audit health',
        toolName: 'get_seo_audit',
        payload: {}
      },
      {
        stepNumber: 2,
        description: 'Read first batch of Bhajans for SEO inspection',
        toolName: 'get_seo_content_batch',
        payload: { contentType: 'bhajan', page: 1, limit: 5 }
      }
    ]);

    assert(planResult.completedSteps === 2, 'E.1', 'Multi-step plan executes all planned steps sequentially');
    assert(planResult.context.status === 'COMPLETED', 'E.2', 'Context status set to COMPLETED after plan execution');
    assert(planResult.context.memory?.stepHistory.length === 2, 'E.3', 'Short-term memory records both executed steps');
    assert(
      Boolean(planResult.context.memory?.plan.every((p) => p.status === 'COMPLETED')),
      'E.4',
      'Plan steps marked COMPLETED in memory'
    );

    // -------------------------------------------------------------
    // PART F & G: RESOURCE LIMITS (TOOL-CALLS & ITERATIONS)
    // -------------------------------------------------------------
    console.log('\n--- PART F & G: RESOURCE LIMITS ---');

    const limitCtx = createAgentContext({
      runId: TEST_RUN_ID,
      agentName: 'seo_audit_agent',
      maxIterations: 2,
      maxToolCalls: 2,
      allowedTools: ['get_seo_audit']
    });

    // Run first 2 calls
    await MultiStepOrchestrator.executeStep(limitCtx, 'get_seo_audit', {});
    await MultiStepOrchestrator.executeStep(limitCtx, 'get_seo_audit', { scope: 'bhajan' });

    let toolLimitExceeded = false;
    try {
      await MultiStepOrchestrator.executeStep(limitCtx, 'get_seo_audit', { scope: 'article' });
    } catch (err: any) {
      if (err instanceof AgentIterationLimitError || err instanceof AgentToolLimitError) {
        toolLimitExceeded = true;
      }
    }
    assert(toolLimitExceeded, 'F.1 / G.1', 'Server-side hard limits enforce tool calls and iteration boundaries');

    // -------------------------------------------------------------
    // PART H: TIMEOUT PROTECTION
    // -------------------------------------------------------------
    console.log('\n--- PART H: TIMEOUT PROTECTION ---');

    const timeoutCtx = createAgentContext({
      runId: TEST_RUN_ID,
      agentName: 'seo_audit_agent',
      timeoutMs: 10, // 10ms timeout
      allowedTools: ['get_seo_audit']
    });

    // Simulate elapsed time
    timeoutCtx.startTime = Date.now() - 500; // 500ms ago

    let timeoutTriggered = false;
    try {
      MultiStepOrchestrator.validateToolSelection(timeoutCtx, 'get_seo_audit', {});
    } catch (err: any) {
      if (err instanceof AgentTimeoutError) timeoutTriggered = true;
    }
    assert(timeoutTriggered, 'H.1', 'MultiStepOrchestrator enforces hard execution timeout');
    assert(timeoutCtx.status === 'TIMEOUT', 'H.2', 'Timeout updates context status to TIMEOUT');

    // -------------------------------------------------------------
    // PART I: LOOP & CYCLE PROTECTION
    // -------------------------------------------------------------
    console.log('\n--- PART I: LOOP & CYCLE PROTECTION ---');

    const loopCtx = createAgentContext({
      runId: TEST_RUN_ID,
      agentName: 'seo_audit_agent',
      allowedTools: ['get_seo_audit', 'get_seo_content_batch'],
      dryRunOnly: true
    });

    // 1. Repeated identical calls test (call identical tool 3 times)
    let repeatedCallLoopBlocked = false;
    try {
      AgentMemoryManager.recordStep(loopCtx, {
        toolName: 'get_seo_audit',
        inputPayload: { scope: 'all' },
        outputPayload: {},
        status: 'SUCCESS',
        durationMs: 10
      });
      AgentMemoryManager.recordStep(loopCtx, {
        toolName: 'get_seo_audit',
        inputPayload: { scope: 'all' },
        outputPayload: {},
        status: 'SUCCESS',
        durationMs: 10
      });

      // Third identical invocation candidate
      AgentMemoryManager.checkLoopProtection(loopCtx, 'get_seo_audit', { scope: 'all' });
    } catch (err: any) {
      if (err instanceof AgentLoopDetectedError && err.message.includes('succession')) {
        repeatedCallLoopBlocked = true;
      }
    }
    assert(repeatedCallLoopBlocked, 'I.1', 'Deterministic detection of repeated identical tool calls');

    // 2. Alternating cycle test (A -> B -> A -> B)
    const pingPongCtx = createAgentContext({
      runId: TEST_RUN_ID,
      agentName: 'seo_audit_agent',
      allowedTools: ['get_seo_audit', 'get_seo_content_batch'],
      dryRunOnly: true
    });

    let pingPongCycleBlocked = false;
    try {
      AgentMemoryManager.recordStep(pingPongCtx, {
        toolName: 'toolA',
        inputPayload: {},
        outputPayload: {},
        status: 'SUCCESS',
        durationMs: 5
      });
      AgentMemoryManager.recordStep(pingPongCtx, {
        toolName: 'toolB',
        inputPayload: {},
        outputPayload: {},
        status: 'SUCCESS',
        durationMs: 5
      });
      AgentMemoryManager.recordStep(pingPongCtx, {
        toolName: 'toolA',
        inputPayload: {},
        outputPayload: {},
        status: 'SUCCESS',
        durationMs: 5
      });
      // Candidate: toolB
      AgentMemoryManager.checkLoopProtection(pingPongCtx, 'toolB', {});
    } catch (err: any) {
      if (err instanceof AgentLoopDetectedError && err.message.includes('Alternating cycle')) {
        pingPongCycleBlocked = true;
      }
    }
    assert(pingPongCycleBlocked, 'I.2', 'Deterministic detection of 2-step alternating ping-pong cycles');

    // -------------------------------------------------------------
    // PART J: RECURSIVE AGENT PROTECTION
    // -------------------------------------------------------------
    console.log('\n--- PART J: RECURSIVE AGENT PROTECTION ---');

    let recursionBlocked = false;
    MultiStepOrchestrator.enterExecution('rec-run-1', 'RecAgent');
    try {
      MultiStepOrchestrator.enterExecution('rec-run-2', 'RecAgent');
    } catch (err: any) {
      if (err instanceof AgentRecursionError) recursionBlocked = true;
    } finally {
      MultiStepOrchestrator.exitExecution('rec-run-1', 'RecAgent');
    }
    assert(recursionBlocked, 'J.1', 'Recursive agent invocation blocked by orchestrator execution tracker');

    // -------------------------------------------------------------
    // PART K: EVALUATION & SAFE TERMINATION
    // -------------------------------------------------------------
    console.log('\n--- PART K: EVALUATION & SAFE TERMINATION ---');

    const evalCtx = createAgentContext({
      runId: TEST_RUN_ID,
      agentName: 'content_improvement_agent',
      allowedTools: ['propose_article_content_improvement'],
      dryRunOnly: false
    });

    // Test catastrophic reduction evaluation
    const safetyEval = StepEvaluator.evaluateStep(
      evalCtx,
      'propose_article_content_improvement',
      { success: true, data: {} },
      {
        entityType: 'article',
        targetField: 'content',
        currentValue:
          'कबीर दास जी के दोहे भक्ति और ज्ञान का अनुपम संगम हैं। यह मूल आलेख विस्तारपूर्वक प्रभु के नाम-स्मरण और जीवन के सार पर प्रकाश डालता है। '.repeat(
            100
          ),
        proposedContent: 'संक्षिप्त सारांश' // Catastrophic reduction!
      }
    );

    assert(safetyEval.status === 'SAFETY_VIOLATION', 'K.1', 'StepEvaluator detects catastrophic content reduction');
    assert(safetyEval.canContinue === false, 'K.2', 'Safety violation halts execution (canContinue: false)');

    // -------------------------------------------------------------
    // PART L: FAILED TOOL HANDLING
    // -------------------------------------------------------------
    console.log('\n--- PART L: FAILED TOOL HANDLING ---');

    const failedEval = StepEvaluator.evaluateStep(
      evalCtx,
      'get_content_item',
      { success: false, error: 'Database timeout' },
      { entityType: 'bhajan', id: TEST_BHAJAN_ID }
    );
    assert(failedEval.status === 'FAILURE', 'L.1', 'StepEvaluator gracefully catches tool execution failure');
    assert(failedEval.canContinue === false, 'L.2', 'Failed step prevents unsafe continuance');

    // -------------------------------------------------------------
    // PART M: PROPOSAL CREATION INTEGRATION
    // -------------------------------------------------------------
    console.log('\n--- PART M: PROPOSAL CREATION INTEGRATION ---');

    const proposalCtx = createAgentContext({
      runId: TEST_RUN_ID,
      agentName: 'BhajanMeaningAgent',
      allowedTools: ['propose_bhajan_meaning'],
      dryRunOnly: false
    });

    const proposalStepResult = await MultiStepOrchestrator.executeStep(proposalCtx, 'propose_bhajan_meaning', {
      entityId: TEST_BHAJAN_ID,
      proposedMeaning: 'यह भजन प्रभु श्रीराम के परम पावन चरणों में अनन्य भक्ति और समर्पण का संदेश देता है।',
      reasoning: 'भावार्थ विस्तार'
    });

    assert(
      proposalStepResult.evaluation.status === 'OBJECTIVE_SATISFIED',
      'M.1',
      'Proposal staging evaluated as OBJECTIVE_SATISFIED'
    );
    assert(proposalCtx.proposalIds?.length === 1, 'M.2', 'Staged proposal ID recorded in context proposalIds');

    const createdProposalId = proposalCtx.proposalIds![0];
    const proposalInDb = await agentProposalRepository.findById(createdProposalId);
    assert(proposalInDb?.status === 'PENDING', 'M.3', 'Staged proposal saved with status PENDING for human review');

    // -------------------------------------------------------------
    // PART N & O: NO AUTONOMOUS APPROVAL OR EXECUTION
    // -------------------------------------------------------------
    console.log('\n--- PART N & O: NO AUTONOMOUS APPROVAL OR EXECUTION ---');

    assert(!toolRegistry.has('approve_proposal'), 'N.1', 'Zero approval tools exist in Tool Registry');
    assert(!toolRegistry.has('execute_proposal'), 'O.1', 'Zero execution tools exist in Tool Registry');

    let agentCannotExecute = false;
    try {
      // Calling executeProposal without human approval throws 400
      await agentProposalService.executeProposal(createdProposalId, 'agent');
    } catch (err: any) {
      if (err.statusCode === 400 && err.message.includes('must be approved')) {
        agentCannotExecute = true;
      }
    }
    assert(agentCannotExecute, 'O.2', 'Pending proposal cannot be executed without human approval');

    // -------------------------------------------------------------
    // PART P: TIER-5 BLOCKING
    // -------------------------------------------------------------
    console.log('\n--- PART P: TIER-5 BLOCKING ---');

    let tier5ToolBlocked = false;
    try {
      await toolGateway.executeTool(
        'apply_bhajan_meaning',
        {
          proposalId: createdProposalId,
          bhajanId: TEST_BHAJAN_ID,
          meaning: 'Bypass'
        },
        proposalCtx
      );
    } catch (err: any) {
      if (err instanceof AgentSecurityError && err.message.includes('Tier-5')) {
        tier5ToolBlocked = true;
      }
    }
    assert(tier5ToolBlocked, 'P.1', 'Autonomous invocation of apply_bhajan_meaning firewalled in ToolGateway');

    // -------------------------------------------------------------
    // PART Q: SACRED CONTENT PROTECTION
    // -------------------------------------------------------------
    console.log('\n--- PART Q: SACRED CONTENT PROTECTION ---');

    let sacredAlterationBlocked = false;
    try {
      await toolGateway.executeTool(
        'propose_bhajan_meaning',
        {
          bhajanId: TEST_BHAJAN_ID,
          targetField: 'lyrics' as any,
          proposedMeaning: 'नया भजन'
        },
        proposalCtx
      );
    } catch {
      sacredAlterationBlocked = true;
    }
    assert(sacredAlterationBlocked, 'Q.1', 'Bhajan lyrics targetField rejected by ToolGateway');

    const bhajanRecord = (await db.query('SELECT lyrics FROM bhajans WHERE id = $1', [TEST_BHAJAN_ID])).rows[0];
    assert(
      bhajanRecord.lyrics === 'जय सिया राम जय जय सिया राम कृपा करो प्रभु कृपा निधान',
      'Q.2',
      'Sacred Bhajan lyrics remain 100% unaltered in database'
    );

    // -------------------------------------------------------------
    // PART R: YOUTUBE EXCLUSION
    // -------------------------------------------------------------
    console.log('\n--- PART R: YOUTUBE EXCLUSION ---');

    let youtubeBlocked = false;
    try {
      await toolGateway.executeTool(
        'propose_seo_metadata',
        {
          entityType: 'youtube' as any,
          entityId: TEST_BHAJAN_ID,
          proposedTitle: 'YouTube Title'
        },
        proposalCtx
      );
    } catch {
      youtubeBlocked = true;
    }
    assert(youtubeBlocked, 'R.1', 'YouTube records strictly excluded from SEO and proposal tools');

    // -------------------------------------------------------------
    // PART S: SCHEDULER READ-ONLY BEHAVIOR
    // -------------------------------------------------------------
    console.log('\n--- PART S: SCHEDULER READ-ONLY BEHAVIOR ---');

    const schedules = await agentSchedulerService.getSchedules();
    const scheduledDefs = agentRegistry.getAllDefinitions();
    const allSchedulerDryRun = scheduledDefs.every((d) => d.dryRunOnly === true);
    assert(allSchedulerDryRun, 'S.1', 'All registered scheduler agents have dryRunOnly: true');

    const schedulerSource = fs.readFileSync(
      path.resolve(__dirname, '../agents/services/AgentSchedulerService.ts'),
      'utf-8'
    );
    assert(!schedulerSource.includes('executeProposal'), 'S.2', 'Scheduler contains zero execution calls');
    assert(!schedulerSource.includes('approveProposal'), 'S.3', 'Scheduler contains zero approval calls');

    // -------------------------------------------------------------
    // PART T: AUDIT TRAIL
    // -------------------------------------------------------------
    console.log('\n--- PART T: AUDIT TRAIL ---');

    const toolCallsLogged = await agentToolCallRepository.findByRunId(TEST_RUN_ID);
    assert(toolCallsLogged.length >= 2, 'T.1', 'Audited tool calls persisted in agent_tool_calls');

    const runRecord = await agentRunRepository.findById(TEST_RUN_ID);
    assert(runRecord !== null, 'T.2', 'Agent run record persisted in agent_runs');
    assert((runRecord?.iterationCount ?? 0) >= 2, 'T.3', 'Iteration count audited in agent_runs');

    // -------------------------------------------------------------
    // PART U: FRONTEND DB ISOLATION
    // -------------------------------------------------------------
    console.log('\n--- PART U: FRONTEND DB ISOLATION ---');

    const frontendFiles = [
      path.resolve(__dirname, '../../../frontend/src/admin/features/agents/AgentRunsSection.tsx'),
      path.resolve(__dirname, '../../../frontend/src/admin/features/agents/AgentApi.ts'),
      path.resolve(__dirname, '../../../frontend/src/admin/pages/ai/index.tsx')
    ];
    let frontendDirectDb = false;
    for (const file of frontendFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        if (content.includes('pg.Pool') || content.includes('DatabaseClient') || content.includes('supabase.from')) {
          frontendDirectDb = true;
        }
      }
    }
    assert(!frontendDirectDb, 'U.1', 'Frontend agent screens have zero direct database access');

    // -------------------------------------------------------------
    // PART V: CONTROLLER / SERVICE / REPOSITORY BOUNDARIES
    // -------------------------------------------------------------
    console.log('\n--- PART V: CONTROLLER / SERVICE BOUNDARIES ---');

    const controllerPath = path.resolve(__dirname, '../admin/controllers/agent.controller.ts');
    const controllerCode = fs.readFileSync(controllerPath, 'utf-8');
    assert(!controllerCode.includes('bhajanRepository.'), 'V.1', 'agent.controller does NOT call bhajanRepository');
    assert(!controllerCode.includes('articleRepository.'), 'V.2', 'agent.controller does NOT call articleRepository');

    // -------------------------------------------------------------
    // CLEANUP TEST DATA
    // -------------------------------------------------------------
    await db.query('DELETE FROM agent_proposals WHERE agent_name LIKE $1', ['%Test%']);
    await db.query('DELETE FROM agent_proposals WHERE entity_id = $1', [TEST_BHAJAN_ID]);
    await db.query('DELETE FROM agent_tool_calls WHERE run_id IN ($1, $2)', [TEST_RUN_ID, TEST_RUN_2_ID]);
    await db.query('DELETE FROM agent_runs WHERE id IN ($1, $2)', [TEST_RUN_ID, TEST_RUN_2_ID]);
    await db.query('DELETE FROM bhajans WHERE id = $1', [TEST_BHAJAN_ID]);

    // -------------------------------------------------------------
    // PART W: PRODUCTION DATA INTEGRITY
    // -------------------------------------------------------------
    console.log('\n--- PART W: PRODUCTION DATA INTEGRITY ---');

    const countsAfter = {
      bhajans: parseInt((await db.query('SELECT COUNT(*) as cnt FROM bhajans')).rows[0].cnt, 10),
      articles: parseInt((await db.query('SELECT COUNT(*) as cnt FROM articles')).rows[0].cnt, 10),
      festivals: parseInt((await db.query('SELECT COUNT(*) as cnt FROM festivals')).rows[0].cnt, 10),
      puranas: parseInt((await db.query('SELECT COUNT(*) as cnt FROM puranas')).rows[0].cnt, 10),
      categories: parseInt((await db.query('SELECT COUNT(*) as cnt FROM categories')).rows[0].cnt, 10)
    };

    assert(
      countsBefore.bhajans === countsAfter.bhajans,
      'W.1',
      `Bhajan count preserved (${countsBefore.bhajans} == ${countsAfter.bhajans})`
    );
    assert(
      countsBefore.articles === countsAfter.articles,
      'W.2',
      `Article count preserved (${countsBefore.articles} == ${countsAfter.articles})`
    );
    assert(
      countsBefore.festivals === countsAfter.festivals,
      'W.3',
      `Festival count preserved (${countsBefore.festivals} == ${countsAfter.festivals})`
    );
    assert(
      countsBefore.puranas === countsAfter.puranas,
      'W.4',
      `Puran count preserved (${countsBefore.puranas} == ${countsAfter.puranas})`
    );
    assert(
      countsBefore.categories === countsAfter.categories,
      'W.5',
      `Category count preserved (${countsBefore.categories} == ${countsAfter.categories})`
    );
  } catch (err: any) {
    console.error('\nVerification suite crashed unexpectedly:', err);
    failed++;
  } finally {
    // Final cleanup safeguard
    try {
      await db.query('DELETE FROM agent_proposals WHERE agent_name LIKE $1', ['%Test%']);
      await db.query('DELETE FROM agent_proposals WHERE entity_id = $1', [TEST_BHAJAN_ID]);
      await db.query('DELETE FROM agent_tool_calls WHERE run_id IN ($1, $2)', [TEST_RUN_ID, TEST_RUN_2_ID]);
      await db.query('DELETE FROM agent_runs WHERE id IN ($1, $2)', [TEST_RUN_ID, TEST_RUN_2_ID]);
      await db.query('DELETE FROM bhajans WHERE id = $1', [TEST_BHAJAN_ID]);
    } catch {
      // Ignore cleanup error
    }
  }

  console.log('\n============================================================');
  console.log(`PHASE 6 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase6Verification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
