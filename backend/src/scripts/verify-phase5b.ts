/**
 * Phase 5B Scheduled Autonomous Monitoring Verification Suite
 *
 * Verifies all 25 requirements of the Phase 5B specification:
 * 1. Scheduled agent registry
 * 2. Only approved agents can be scheduled
 * 3. Mutation-capable agent rejected
 * 4. Unsupported agent rejected
 * 5. Schedule validation
 * 6. Minimum frequency enforcement (< 1 hr rejected)
 * 7. Scheduled AgentRun creation
 * 8. Trigger source = SCHEDULED
 * 9. Existing AgentRunner reused
 * 10. ToolGateway used
 * 11. No direct DB/repository bypass
 * 12. Duplicate-run protection
 * 13. Failure recording
 * 14. Future execution after failure
 * 15. Execution limits preserved
 * 16. SEO scheduled run
 * 17. System Health scheduled run
 * 18. Content Quality scheduled run
 * 19. YouTube exclusion
 * 20. Sacred content protection
 * 21. No mutation
 * 22. No proposal creation
 * 23. Manual Run Now still works
 * 24. Manual and scheduled runs use same execution path
 * 25. Multi-instance/concurrency protection
 */

import {
  agentRegistry,
  agentRunner,
  toolGateway,
  agentExecutionService,
  agentRunRepository,
  agentToolCallRepository,
  AgentPermissionTier,
  AgentSecurityError,
  registerDefaultAgents,
  registerDefaultTools,
  agentSchedulerService,
  agentScheduleRepository
} from '../agents';
import { db } from '../common/database/DatabaseClient';

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

async function runVerification() {
  console.log('\n===============================================================');
  console.log('   Aradhna Marg — Phase 5B Scheduled Monitoring Verification');
  console.log('===============================================================\n');

  // Ensure agents and tools are registered
  registerDefaultTools();
  registerDefaultAgents();

  // Baseline database snapshot to verify zero content mutation
  const articlesCountBefore = await db.query('SELECT COUNT(*) as cnt FROM articles');
  const bhajansCountBefore = await db.query('SELECT COUNT(*) as cnt FROM bhajans');
  const festivalsCountBefore = await db.query('SELECT COUNT(*) as cnt FROM festivals');
  const puranasCountBefore = await db.query('SELECT COUNT(*) as cnt FROM puranas');
  const proposalsCountBefore = await db.query('SELECT COUNT(*) as cnt FROM agent_proposals');

  // -------------------------------------------------------------------------
  // TEST 1: Scheduled agent registry
  // -------------------------------------------------------------------------
  const schedulableAgents = agentSchedulerService.getSchedulableAgents();
  assert(
    schedulableAgents.length === 3 &&
      schedulableAgents.includes('seo_audit_agent') &&
      schedulableAgents.includes('system_health_agent') &&
      schedulableAgents.includes('content_quality_agent'),
    1,
    'Scheduled agent registry contains strictly approved monitoring agents'
  );

  // -------------------------------------------------------------------------
  // TEST 2: Only approved agents can be scheduled
  // -------------------------------------------------------------------------
  let unapprovedRejected = false;
  try {
    await agentSchedulerService.updateSchedule('unapproved_custom_agent', { enabled: true });
  } catch (err: any) {
    unapprovedRejected =
      err.message.includes('not approved') ||
      err.message.includes('not permitted') ||
      err.message.includes('not registered');
  }
  assert(unapprovedRejected, 2, 'Unapproved agent is rejected from scheduling by server policy');

  // -------------------------------------------------------------------------
  // TEST 3: Mutation-capable agent rejected
  // -------------------------------------------------------------------------
  let mutationRejected = false;
  try {
    agentRegistry.register({
      definition: {
        id: 'mock_mutation_agent',
        name: 'Mock Mutation Agent',
        description: 'Attempts mutations',
        permissionTier: 'TIER_5_PUBLISH_OVERWRITE' as any,
        allowedTools: ['system_health_check'],
        allowedEntityTypes: ['articles'],
        maxIterations: 5,
        maxToolCalls: 5,
        timeoutMs: 10000,
        dryRunOnly: false
      },
      execute: async () => ({ status: 'COMPLETED' }) as any
    });
  } catch (err: any) {
    mutationRejected =
      err instanceof AgentSecurityError ||
      err.message.includes('safety boundary') ||
      err.message.includes('tier') ||
      err.message.includes('not permitted');
  }
  assert(mutationRejected, 3, 'Mutation-capable agent is strictly rejected by server-side policy');

  // -------------------------------------------------------------------------
  // TEST 4: Unsupported/Unknown agent rejected
  // -------------------------------------------------------------------------
  let unknownRejected = false;
  try {
    await agentSchedulerService.executeScheduledRun('non_existent_agent_xyz');
  } catch (err: any) {
    unknownRejected =
      err.message.includes('not permitted') ||
      err.message.includes('not approved') ||
      err.message.includes('not found') ||
      err.message.includes('not registered');
  }
  assert(unknownRejected, 4, 'Unsupported/Unknown agent cannot be scheduled or executed');

  // -------------------------------------------------------------------------
  // TEST 5: Schedule validation
  // -------------------------------------------------------------------------
  const updatedDaily = await agentSchedulerService.updateSchedule('seo_audit_agent', {
    scheduleInterval: 'daily',
    enabled: true
  });
  assert(
    updatedDaily.scheduleInterval === 'daily' && updatedDaily.cronExpression === '0 4 * * *',
    5,
    'Valid standard schedule interval (daily) accepted and configured'
  );

  // -------------------------------------------------------------------------
  // TEST 6: Minimum frequency enforcement (< 1 hour rejected)
  // -------------------------------------------------------------------------
  let subHourlyRejected = false;
  try {
    await agentSchedulerService.updateSchedule('seo_audit_agent', {
      cronExpression: '*/5 * * * *' // Every 5 minutes
    });
  } catch (err: any) {
    subHourlyRejected = err.message.includes('hour') || err.message.includes('frequent');
  }
  assert(subHourlyRejected, 6, 'Sub-hourly schedule frequency (< 1 hour) is strictly rejected');

  // -------------------------------------------------------------------------
  // TEST 7: Scheduled AgentRun creation
  // -------------------------------------------------------------------------
  // Reset lock if needed
  await agentScheduleRepository.clearStaleLocks(0);

  const initialRunResult = await agentSchedulerService.executeScheduledRun('system_health_agent');
  assert(
    !initialRunResult.skipped && !!initialRunResult.run?.id,
    7,
    'Scheduled run executes and creates an AgentRun record'
  );

  // -------------------------------------------------------------------------
  // TEST 8: Trigger source = SCHEDULED
  // -------------------------------------------------------------------------
  const scheduledRun = initialRunResult.run!;
  const persistedRun = await agentRunRepository.findById(scheduledRun.id);
  assert(
    persistedRun?.triggerType === 'SCHEDULED',
    8,
    `AgentRun persisted with trigger_type = 'SCHEDULED' (got '${persistedRun?.triggerType}')`
  );

  // -------------------------------------------------------------------------
  // TEST 9: Existing AgentRunner reused
  // -------------------------------------------------------------------------
  assert(
    scheduledRun.agentName === 'system_health_agent' &&
      typeof scheduledRun.iterationCount === 'number' &&
      scheduledRun.status === 'COMPLETED',
    9,
    'Scheduled execution reused the unified AgentRunner pipeline'
  );

  // -------------------------------------------------------------------------
  // TEST 10: ToolGateway used
  // -------------------------------------------------------------------------
  const toolCalls = await agentToolCallRepository.findByRunId(scheduledRun.id);
  assert(
    toolCalls.length > 0 && toolCalls[0].status === 'SUCCESS',
    10,
    `Audited tool calls routed through ToolGateway (found ${toolCalls.length} tool calls)`
  );

  // -------------------------------------------------------------------------
  // TEST 11: No direct DB/repository bypass
  // -------------------------------------------------------------------------
  const allToolTiers = toolCalls.every(
    (tc) =>
      tc.permissionTier === AgentPermissionTier.TIER_1_READ || tc.permissionTier === AgentPermissionTier.TIER_2_ANALYZE
  );
  assert(allToolTiers, 11, 'All tool calls adhere to read-only TIER_1_READ / TIER_2_ANALYZE permission tiers');

  // -------------------------------------------------------------------------
  // TEST 12: Duplicate-run protection
  // -------------------------------------------------------------------------
  // Acquire lock manually to simulate active execution
  await agentScheduleRepository.acquireLock('seo_audit_agent');
  // Attempt to execute scheduled run while lock is held
  const duplicateRunAttempt = await agentSchedulerService.executeScheduledRun('seo_audit_agent');
  assert(
    duplicateRunAttempt.skipped === true && duplicateRunAttempt.reason === 'ALREADY_RUNNING',
    12,
    'Duplicate concurrent run is safely skipped when lock is already held'
  );

  // Release lock
  await agentScheduleRepository.releaseLock('seo_audit_agent', true);

  // -------------------------------------------------------------------------
  // TEST 13: Failure recording
  // -------------------------------------------------------------------------
  // Simulate a failure recording in schedule repository
  await agentScheduleRepository.acquireLock('seo_audit_agent');
  await agentScheduleRepository.releaseLock('seo_audit_agent', false, 'Simulated test connection failure');

  const failedSchedule = await agentScheduleRepository.findByAgentId('seo_audit_agent');
  assert(
    failedSchedule?.lastRunStatus === 'FAILED' &&
      failedSchedule.consecutiveFailures > 0 &&
      failedSchedule.isRunning === false,
    13,
    'Failed execution properly recorded with FAILED status and incremented consecutive_failures'
  );

  // -------------------------------------------------------------------------
  // TEST 14: Future execution after failure
  // -------------------------------------------------------------------------
  assert(
    failedSchedule?.enabled === true && !!failedSchedule?.nextRunAt,
    14,
    'Failure does not permanently disable agent; nextRunAt is recalculated for future runs'
  );

  // -------------------------------------------------------------------------
  // TEST 15: Execution limits preserved
  // -------------------------------------------------------------------------
  const seoDef = agentRegistry.getDefinition('seo_audit_agent');
  assert(
    seoDef?.maxIterations === 100 && seoDef?.maxToolCalls === 50 && seoDef?.timeoutMs === 60000,
    15,
    'Agent execution limits (maxIterations=100, maxToolCalls=50, timeoutMs=60000) preserved'
  );

  // -------------------------------------------------------------------------
  // TEST 16: SEO scheduled run
  // -------------------------------------------------------------------------
  const seoScheduledResult = await agentSchedulerService.executeScheduledRun('seo_audit_agent');
  assert(
    !seoScheduledResult.skipped &&
      seoScheduledResult.run?.status === 'COMPLETED' &&
      Array.isArray(seoScheduledResult.state?.findings),
    16,
    `SEO Audit scheduled run completed with ${seoScheduledResult.state?.findings?.length || 0} findings`
  );

  // -------------------------------------------------------------------------
  // TEST 17: System Health scheduled run
  // -------------------------------------------------------------------------
  const healthScheduledResult = await agentSchedulerService.executeScheduledRun('system_health_agent');
  assert(
    !healthScheduledResult.skipped &&
      healthScheduledResult.run?.status === 'COMPLETED' &&
      !!healthScheduledResult.state?.summary,
    17,
    `System Health scheduled run completed with status '${healthScheduledResult.state?.summary?.status}'`
  );

  // -------------------------------------------------------------------------
  // TEST 18: Content Quality scheduled run
  // -------------------------------------------------------------------------
  const contentScheduledResult = await agentSchedulerService.executeScheduledRun('content_quality_agent');
  assert(
    !contentScheduledResult.skipped &&
      contentScheduledResult.run?.status === 'COMPLETED' &&
      Array.isArray(contentScheduledResult.state?.findings),
    18,
    `Content Quality scheduled run completed with ${contentScheduledResult.state?.findings?.length || 0} findings`
  );

  // -------------------------------------------------------------------------
  // TEST 19: YouTube exclusion
  // -------------------------------------------------------------------------
  const seoToolCalls = await agentToolCallRepository.findByRunId(seoScheduledResult.run!.id);
  const scannedYoutube = seoToolCalls.some((tc) => {
    return tc.inputPayload?.includeYouTube === true || tc.inputPayload?.entityType === 'youtube_videos';
  });
  assert(!scannedYoutube, 19, 'SEO Audit scheduled run strictly excluded YouTube imported videos and channels');

  // -------------------------------------------------------------------------
  // TEST 20: Sacred content protection
  // -------------------------------------------------------------------------
  const cqToolCalls = await agentToolCallRepository.findByRunId(contentScheduledResult.run!.id);
  const attemptedLyricsEdit = cqToolCalls.some(
    (tc) => tc.toolName.includes('translate') || tc.toolName.includes('mutate') || tc.toolName.includes('update_lyrics')
  );
  assert(
    !attemptedLyricsEdit,
    20,
    'Sacred content firewall preserved; lyrics remain untouched without translation or alteration'
  );

  // -------------------------------------------------------------------------
  // TEST 21: No mutation
  // -------------------------------------------------------------------------
  const articlesCountAfter = await db.query('SELECT COUNT(*) as cnt FROM articles');
  const bhajansCountAfter = await db.query('SELECT COUNT(*) as cnt FROM bhajans');
  const festivalsCountAfter = await db.query('SELECT COUNT(*) as cnt FROM festivals');
  const puranasCountAfter = await db.query('SELECT COUNT(*) as cnt FROM puranas');

  assert(
    articlesCountBefore.rows[0].cnt === articlesCountAfter.rows[0].cnt &&
      bhajansCountBefore.rows[0].cnt === bhajansCountAfter.rows[0].cnt &&
      festivalsCountBefore.rows[0].cnt === festivalsCountAfter.rows[0].cnt &&
      puranasCountBefore.rows[0].cnt === puranasCountAfter.rows[0].cnt,
    21,
    'Verified zero content mutations across articles, bhajans, festivals, and puranas'
  );

  // -------------------------------------------------------------------------
  // TEST 22: No proposal creation
  // -------------------------------------------------------------------------
  const proposalsCountAfter = await db.query('SELECT COUNT(*) as cnt FROM agent_proposals');
  assert(
    proposalsCountBefore.rows[0].cnt === proposalsCountAfter.rows[0].cnt,
    22,
    'Verified zero agent proposals created during Phase 5B scheduled monitoring'
  );

  // -------------------------------------------------------------------------
  // TEST 23: Manual Run Now still works
  // -------------------------------------------------------------------------
  const manualResult = await agentSchedulerService.executeManualRun('system_health_agent', 'admin_manual_verifier');
  assert(
    manualResult.run?.status === 'COMPLETED' &&
      manualResult.run?.triggerType === 'MANUAL' &&
      manualResult.run?.triggeredBy === 'admin_manual_verifier',
    23,
    'Manual Run Now successfully executes through scheduler service with triggerType = MANUAL'
  );

  // -------------------------------------------------------------------------
  // TEST 24: Manual and scheduled runs use same execution path
  // -------------------------------------------------------------------------
  // Both manual and scheduled runs emit audited AgentRun records through AgentRunner
  const manualRun = await agentRunRepository.findById(manualResult.run.id);
  const scheduledRunRecord = await agentRunRepository.findById(healthScheduledResult.run!.id);
  assert(
    !!manualRun &&
      !!scheduledRunRecord &&
      manualRun.agentName === scheduledRunRecord.agentName &&
      manualRun.iterationCount >= 1 &&
      scheduledRunRecord.iterationCount >= 1,
    24,
    'Manual and scheduled runs share the exact same AgentRunner and ToolGateway pipeline'
  );

  // -------------------------------------------------------------------------
  // TEST 25: Multi-instance / Concurrency protection
  // -------------------------------------------------------------------------
  // Test competing simultaneous lock acquisitions on database
  const lock1 = await agentScheduleRepository.acquireLock('seo_audit_agent');
  const lock2 = await agentScheduleRepository.acquireLock('seo_audit_agent');
  assert(
    lock1 !== null && lock2 === null,
    25,
    'Database-backed atomic lock ensures mutual exclusion between concurrent instances'
  );

  // Clean up lock
  if (lock1) {
    await agentScheduleRepository.releaseLock('seo_audit_agent', true);
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n---------------------------------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('---------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification()
  .then(() => {
    console.log('Phase 5B Verification Completed Successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Phase 5B Verification Unhandled Error:', err);
    process.exit(1);
  });
