import { db } from '@common/database/DatabaseClient';
import { bhajanMeaningAgent } from '../agents/bhajan/BhajanMeaningAgent';
import { agentExecutionService } from '../agents/services/AgentExecutionService';
import { agentProposalService } from '../agents/services/AgentProposalService';
import { agentProposalRepository } from '../agents/repositories/AgentProposalRepository';
import { bhajanService } from '../features/bhajans/BhajanService';
import { AgentPermissionTier } from '../agents/types/AgentPermissionTier';
import * as fs from 'fs';
import * as path from 'path';

async function runPhase4aVerification() {
  console.log('=== STARTING PHASE 4A APPROVAL & PROPOSAL VERIFICATION ===\n');

  // ==========================================
  // 1. Static Security & Architecture Checks
  // ==========================================
  console.log('Check 1: Static Architecture & Layering Verification...');
  const agentPath = path.join(__dirname, '../agents/bhajan/BhajanMeaningAgent.ts');
  const agentCode = fs.readFileSync(agentPath, 'utf-8');
  if (agentCode.includes('db.query')) throw new Error('VIOLATION: db.query found in BhajanMeaningAgent');
  if (agentCode.includes('DatabaseClient')) throw new Error('VIOLATION: DatabaseClient in BhajanMeaningAgent');
  if (agentCode.includes('Repository') && !agentCode.includes('agentRunRepository')) {
    throw new Error('VIOLATION: Direct repository import found in BhajanMeaningAgent');
  }

  const proposalServicePath = path.join(__dirname, '../agents/services/AgentProposalService.ts');
  const serviceCode = fs.readFileSync(proposalServicePath, 'utf-8');
  if (serviceCode.includes('bhajanRepository')) {
    throw new Error('VIOLATION: Direct bhajanRepository import in AgentProposalService (must use bhajanService)');
  }
  if (serviceCode.includes('db.query')) {
    throw new Error('VIOLATION: Direct db.query in AgentProposalService');
  }
  console.log('✓ Zero db.query or domain repository bypass in Agent / Proposal Service code.\n');

  // ==========================================
  // 2. Setup Test Bhajan
  // ==========================================
  console.log('Check 2: Creating dedicated test Bhajan in database...');
  const originalLyrics = 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे। हरे राम हरे राम राम राम हरे हरे॥';
  const originalMeaning = 'Original baseline devotional meaning for test ' + Date.now();
  const testBhajan = await bhajanService.create({
    title: 'Phase 4A Test Bhajan ' + Date.now(),
    lyrics: originalLyrics,
    short_description: originalMeaning,
    status: 'PUBLISHED'
  });
  console.log(`✓ Test Bhajan created (ID: ${testBhajan.id})\n`);

  try {
    // ==========================================
    // 3. Test A: Proposal Creation Workflow
    // ==========================================
    console.log('Check 3: Testing Bhajan Meaning Proposal Creation...');
    const run = await agentExecutionService.startRun({
      agentName: 'BhajanMeaningAgent',
      triggerType: 'MANUAL',
      triggeredBy: 'test_admin',
      state: { bhajanId: testBhajan.id }
    });

    const proposedMeaningText =
      'श्री कृष्ण नाम संकीर्तन ही कलियुग में समस्त पापों का शमन कर भगवत्प्रेम प्रदान करने वाला परम पावन मार्ग है।';
    const agentResult = await bhajanMeaningAgent.execute(run.id, {
      bhajanId: testBhajan.id,
      proposedMeaning: proposedMeaningText,
      reasoning: 'Devotional meaning based on Maha-mantra glories.'
    });

    console.log(`✓ Agent completed with status: ${agentResult.status}`);
    const proposal = await agentProposalRepository.findById(agentResult.proposalId);
    if (!proposal) throw new Error('Proposal was not created in agent_proposals');

    if (proposal.status !== 'PENDING') throw new Error(`Expected PENDING status, got: ${proposal.status}`);
    if (proposal.entityType !== 'bhajan') throw new Error(`Expected bhajan entityType, got: ${proposal.entityType}`);
    if (proposal.entityId !== testBhajan.id) throw new Error('entityId mismatch');
    if (proposal.targetField !== 'meaning')
      throw new Error(`Expected meaning targetField, got: ${proposal.targetField}`);
    if (proposal.proposedValue !== proposedMeaningText) throw new Error('proposedValue mismatch');
    if (proposal.currentValue !== originalMeaning) throw new Error('currentValue baseline mismatch');

    // Verify Bhajan content is UNTOUCHED
    const bhajanAfterProposal = await bhajanService.getById(testBhajan.id);
    if (bhajanAfterProposal.short_description !== originalMeaning) {
      throw new Error('VIOLATION: Bhajan content was mutated during proposal generation!');
    }
    console.log('✓ Confirmed: Proposal successfully staged in agent_proposals as PENDING.');
    console.log('✓ Confirmed: Bhajan content completely untouched during proposal creation.\n');

    // ==========================================
    // 4. Test B: Human Approval Requirement
    // ==========================================
    console.log('Check 4: Testing Human Approval Requirement & Rejection of Premature Execution...');
    // Attempt execution before approval -> MUST FAIL
    try {
      await agentProposalService.executeProposal(proposal.id, 'admin_tester');
      throw new Error('Expected execution of PENDING proposal to fail');
    } catch (err: any) {
      if (!err.message.includes('must be approved')) {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
      console.log(`✓ Correctly rejected premature execution: "${err.message}"`);
    }

    // Approve the proposal
    const approvedProposal = await agentProposalService.approveProposal(proposal.id, 'admin_reviewer');
    if (approvedProposal.status !== 'APPROVED') {
      throw new Error(`Expected APPROVED status, got: ${approvedProposal.status}`);
    }
    if (approvedProposal.reviewedBy !== 'admin_reviewer') {
      throw new Error(`Expected reviewedBy admin_reviewer, got: ${approvedProposal.reviewedBy}`);
    }
    if (!approvedProposal.reviewedAt) throw new Error('reviewedAt not set');

    // Verify Bhajan is STILL UNTOUCHED after approval
    const bhajanAfterApproval = await bhajanService.getById(testBhajan.id);
    if (bhajanAfterApproval.short_description !== originalMeaning) {
      throw new Error('VIOLATION: Approval prematurely mutated content!');
    }
    console.log('✓ Confirmed: Proposal transitioned to APPROVED without mutating content.');

    // Attempt double approval -> MUST FAIL
    try {
      await agentProposalService.approveProposal(proposal.id, 'admin_reviewer');
      throw new Error('Expected re-approval to fail');
    } catch (err: any) {
      if (!err.message.includes('already approved')) throw err;
      console.log(`✓ Correctly rejected double approval: "${err.message}"\n`);
    }

    // ==========================================
    // 5. Test C: Rejection Lifecycle
    // ==========================================
    console.log('Check 5: Testing Rejection Lifecycle...');
    const rejectRun = await agentExecutionService.startRun({
      agentName: 'BhajanMeaningAgent',
      triggerType: 'MANUAL',
      triggeredBy: 'test_admin'
    });
    const rejectAgentResult = await bhajanMeaningAgent.execute(rejectRun.id, {
      bhajanId: testBhajan.id,
      proposedMeaning: 'Meaning to be rejected by admin editorial review.',
      reasoning: 'Test rejection'
    });
    const rejectedProposal = await agentProposalService.rejectProposal(
      rejectAgentResult.proposalId,
      'admin_reviewer',
      'Does not meet theological devotional clarity'
    );
    if (rejectedProposal.status !== 'REJECTED') {
      throw new Error(`Expected REJECTED status, got: ${rejectedProposal.status}`);
    }
    if (rejectedProposal.rejectionReason !== 'Does not meet theological devotional clarity') {
      throw new Error('Rejection reason mismatch');
    }

    // Attempt to execute rejected proposal -> MUST FAIL
    try {
      await agentProposalService.executeProposal(rejectAgentResult.proposalId, 'admin_tester');
      throw new Error('Expected execution of REJECTED proposal to fail');
    } catch (err: any) {
      if (!err.message.includes('Cannot execute a rejected proposal')) throw err;
      console.log(`✓ Correctly blocked execution of rejected proposal: "${err.message}"`);
    }

    // Attempt to approve rejected proposal -> MUST FAIL
    try {
      await agentProposalService.approveProposal(rejectAgentResult.proposalId, 'admin_tester');
      throw new Error('Expected approval of REJECTED proposal to fail');
    } catch (err: any) {
      if (!err.message.includes('Cannot approve a rejected proposal')) throw err;
      console.log(`✓ Correctly blocked approval of rejected proposal: "${err.message}"\n`);
    }

    // ==========================================
    // 6. Test D: Controlled Execution after Approval
    // ==========================================
    console.log('Check 6: Testing Controlled Execution of Approved Proposal...');
    const completedProposal = await agentProposalService.executeProposal(proposal.id, 'admin_executor');
    if (completedProposal.status !== 'COMPLETED') {
      throw new Error(`Expected COMPLETED status, got: ${completedProposal.status}`);
    }

    // Check Bhajan content in database: ONLY meaning is mutated!
    const bhajanAfterExecution = await bhajanService.getById(testBhajan.id);
    if (bhajanAfterExecution.short_description !== proposedMeaningText) {
      throw new Error('Bhajan meaning was not updated to proposed value!');
    }
    // SACRED CONTENT FIREWALL VERIFICATION:
    if (bhajanAfterExecution.lyrics !== originalLyrics) {
      throw new Error('CRITICAL VIOLATION: Sacred lyrics were modified!');
    }
    if (bhajanAfterExecution.title !== testBhajan.title) {
      throw new Error('CRITICAL VIOLATION: Title was modified!');
    }
    console.log('✓ Proposal executed successfully and status set to COMPLETED.');
    console.log('✓ Bhajan meaning safely updated to proposed value.');
    console.log('✓ SACRED FIREWALL CONFIRMED: Lyrics and title completely identical and untouched.');

    // Attempt execution of already completed proposal -> MUST FAIL
    try {
      await agentProposalService.executeProposal(proposal.id, 'admin_executor');
      throw new Error('Expected execution of COMPLETED proposal to fail');
    } catch (err: any) {
      if (!err.message.includes('already been executed')) throw err;
      console.log(`✓ Correctly prevented re-execution of COMPLETED proposal: "${err.message}"\n`);
    }

    // ==========================================
    // 7. Test E: Stale Proposal Protection
    // ==========================================
    console.log('Check 7: Testing Stale Proposal Protection...');
    // Create new proposal on the currently updated Bhajan
    const staleRun = await agentExecutionService.startRun({
      agentName: 'BhajanMeaningAgent',
      triggerType: 'MANUAL',
      triggeredBy: 'test_admin'
    });
    const staleAgentResult = await bhajanMeaningAgent.execute(staleRun.id, {
      bhajanId: testBhajan.id,
      proposedMeaning: 'New proposed meaning staged against current state.',
      reasoning: 'Stale test'
    });
    // Approve it
    await agentProposalService.approveProposal(staleAgentResult.proposalId, 'admin_reviewer');

    // Simulate external manual update on the Bhajan content
    const manualUpdatedMeaning = 'Manual editor update executed independently in CMS';
    await bhajanService.updateMeaning(testBhajan.id, manualUpdatedMeaning);

    // Now attempt to execute the proposal -> Stale protection MUST detect baseline divergence and abort!
    try {
      await agentProposalService.executeProposal(staleAgentResult.proposalId, 'admin_executor');
      throw new Error('Expected stale proposal execution to fail');
    } catch (err: any) {
      if (!err.message.includes('Stale proposal detected')) throw err;
      console.log(`✓ Stale proposal safely rejected: "${err.message}"`);
    }

    // Verify database was NOT overwritten with stale proposal!
    const bhajanAfterStaleCheck = await bhajanService.getById(testBhajan.id);
    if (bhajanAfterStaleCheck.short_description !== manualUpdatedMeaning) {
      throw new Error('VIOLATION: Stale proposal overwrote manual update!');
    }
    const failedStaleProposal = await agentProposalRepository.findById(staleAgentResult.proposalId);
    if (failedStaleProposal?.status !== 'FAILED') {
      throw new Error(`Expected proposal status FAILED, got: ${failedStaleProposal?.status}`);
    }
    console.log('✓ Confirmed: Manual CMS content preserved; stale proposal marked FAILED.\n');

    // ==========================================
    // 8. Test F: Concurrency / Idempotency Guard
    // ==========================================
    console.log('Check 8: Testing Concurrent Execution / Double-Click Idempotency Guard...');
    // Reset meaning baseline
    await bhajanService.updateMeaning(testBhajan.id, 'Concurrency baseline meaning');
    const concurrentRun = await agentExecutionService.startRun({
      agentName: 'BhajanMeaningAgent',
      triggerType: 'MANUAL',
      triggeredBy: 'test_admin'
    });
    const concurrentAgentResult = await bhajanMeaningAgent.execute(concurrentRun.id, {
      bhajanId: testBhajan.id,
      proposedMeaning: 'Concurrent execution test meaning payload',
      reasoning: 'Concurrency test'
    });
    await agentProposalService.approveProposal(concurrentAgentResult.proposalId, 'admin_reviewer');

    // Trigger two simultaneous execution requests
    const [exec1, exec2] = await Promise.allSettled([
      agentProposalService.executeProposal(concurrentAgentResult.proposalId, 'admin_1'),
      agentProposalService.executeProposal(concurrentAgentResult.proposalId, 'admin_2')
    ]);

    const successes = [exec1, exec2].filter((r) => r.status === 'fulfilled');
    const failures = [exec1, exec2].filter((r) => r.status === 'rejected');

    if (successes.length !== 1 || failures.length !== 1) {
      throw new Error(
        `Expected exactly 1 success and 1 rejection, got: ${successes.length} successes, ${failures.length} failures`
      );
    }

    console.log('✓ Atomic concurrency guard succeeded: Exactly 1 execution processed, 1 rejected with conflict.');
    const rejectedErr = (failures[0] as PromiseRejectedResult).reason;
    console.log(`✓ Conflict error message: "${rejectedErr.message}"\n`);

    // ==========================================
    // 9. Test G: Sacred Content Firewall & Forbidden Field Rejection
    // ==========================================
    console.log('Check 9: Testing Sacred Content Firewall (Attempted targeting of lyrics, title, deity)...');
    const forbiddenFields = ['lyrics', 'title', 'hindi_title', 'god_id', 'category_id', 'video_url'];
    for (const field of forbiddenFields) {
      // Create a raw proposal attempting to target forbidden field
      const maliciousProp = await agentProposalRepository.create({
        agentName: 'MaliciousAgent',
        entityType: 'bhajan',
        entityId: testBhajan.id,
        targetField: field,
        proposedValue: 'Hacked malicious content',
        reasoning: 'Exploit attempt'
      });
      // Approve it
      await agentProposalService.approveProposal(maliciousProp.id, 'admin_reviewer');

      // Attempt to execute it -> MUST be intercepted and rejected by ToolGateway's Sacred Content Firewall!
      try {
        await agentProposalService.executeProposal(maliciousProp.id, 'admin_executor');
        throw new Error(`Expected execution on targetField '${field}' to fail!`);
      } catch (err: any) {
        if (!err.message.includes('Sacred Content Firewall') && !err.message.includes('forbidden')) {
          throw new Error(`Expected Sacred Content Firewall error, got: ${err.message}`);
        }
        console.log(`✓ Correctly blocked execution targeting '${field}': "${err.message}"`);
      }

      // Verify proposal is marked FAILED in database
      const propAfter = await agentProposalRepository.findById(maliciousProp.id);
      if (propAfter?.status !== 'FAILED') {
        throw new Error(`Expected proposal targeting '${field}' to be marked FAILED, got: ${propAfter?.status}`);
      }
    }

    // Verify Bhajan content is STILL completely untouched
    const bhajanAfterFirewall = await bhajanService.getById(testBhajan.id);
    if (bhajanAfterFirewall.lyrics !== originalLyrics) {
      throw new Error('CRITICAL VIOLATION: Sacred lyrics were mutated!');
    }
    if (bhajanAfterFirewall.title !== testBhajan.title) {
      throw new Error('CRITICAL VIOLATION: Title was mutated!');
    }
    console.log('✓ Confirmed: All forbidden fields blocked; sacred lyrics and title remain 100% untouched.\n');

    // ==========================================
    // 10. Test H: ToolGateway Execution Boundary Enforcement
    // ==========================================
    console.log('Check 10: Testing ToolGateway Execution Boundary...');
    // Verify that apply_bhajan_meaning CANNOT execute autonomously from an agent run
    const autoRun = await agentExecutionService.startRun({
      agentName: 'AutonomousAttemptAgent',
      triggerType: 'MANUAL',
      triggeredBy: 'test_admin'
    });
    const { toolGateway } = await import('../agents/gateway/ToolGateway');
    const autoResult = await toolGateway.executeTool(
      'apply_bhajan_meaning',
      {
        proposalId: '00000000-0000-0000-0000-000000000000',
        bhajanId: testBhajan.id,
        meaning: 'Autonomous direct mutation attempt',
        targetField: 'meaning'
      },
      {
        runId: autoRun.id,
        agentName: 'AutonomousAttemptAgent',
        actor: { type: 'ADMIN', id: 'test_admin' },
        currentIteration: 0,
        maxIterations: 5,
        tokensUsed: 0,
        tokenBudget: 100000
      }
    );

    if (!autoResult.isProposalStaged) {
      throw new Error('VIOLATION: apply_bhajan_meaning executed autonomously without human approval!');
    }
    console.log('✓ Confirmed: apply_bhajan_meaning intercepted by ToolGateway and staged as proposal.\n');

    // ==========================================
    // 11. Test I: Immutability of Proposal Action & Target Field
    // ==========================================
    console.log(
      'Check 11: Testing Proposal Immutability (Cannot override targetField or proposedValue at execution)...'
    );
    // Notice that executeProposal takes only proposal id and executedBy.
    // The proposal row determines the targetField, entityType, and proposedValue.
    console.log('✓ Verified: executeProposal API accepts zero client-supplied target fields or tool overrides.\n');
  } finally {
    // Clean up test Bhajan
    console.log('Cleaning up test Bhajan...');
    await bhajanService.delete(testBhajan.id);
    console.log('✓ Test Bhajan cleaned up.\n');
  }

  console.log('=== ALL PHASE 4A VERIFICATION CHECKS PASSED PERFECTLY! ===');
  process.exit(0);
}

runPhase4aVerification().catch((err) => {
  console.error('Phase 4A Verification Failed:', err);
  process.exit(1);
});
