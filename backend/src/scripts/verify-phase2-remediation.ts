import { db } from '@common/database/DatabaseClient';
import { AiJobRepository } from '../admin/repositories/AiJobRepository';
import { aiJobService } from '../admin/services/AiJobService';
import { retryFailedJobTool } from '../agents/tools/ops/RetryFailedJobTool';
import { getContentItemTool } from '../agents/tools/content/GetContentItemTool';
import { searchContentTool } from '../agents/tools/content/SearchContentTool';
import { toolGateway } from '../agents';
import { agentRunRepository } from '../agents/repositories/AgentRunRepository';
import { AgentContext } from '../agents/types/AgentContext';
import * as fs from 'fs';
import * as path from 'path';

async function runRemediationVerification() {
  console.log('=== STARTING PHASE 2 REMEDIATION VERIFICATION ===\n');
  const aiJobRepo = new AiJobRepository();

  const run = await agentRunRepository.create({
    agentName: 'RemediationVerificationAgent',
    triggerType: 'MANUAL',
    triggeredBy: 'test_admin'
  });

  const mockContext: AgentContext = {
    runId: run.id,
    agentName: 'RemediationVerificationAgent',
    actor: { type: 'ADMIN', id: 'test_admin' },
    currentIteration: 0,
    maxIterations: 10,
    tokensUsed: 0,
    tokenBudget: 10000
  };

  // Helper to insert test job
  async function createTestJob(status: string) {
    const res = await db.query(
      `INSERT INTO ai_jobs (job_name, content_type, action_type, total_items, status, content_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        `Test Job ${status} ${Date.now()}`,
        'article',
        'GENERATE_SUMMARY',
        1,
        status,
        '00000000-0000-0000-0000-000000000001',
        JSON.stringify({ originalField: 'untouched' })
      ]
    );
    return res.rows[0];
  }

  // --- ISSUE 1 TESTS ---

  // 1. FAILED job can be retried successfully
  console.log('Test 1: FAILED job can be retried successfully...');
  const failedJob = await createTestJob('FAILED');
  const retryResult = await toolGateway.executeTool('retry_failed_job', { jobId: failedJob.id }, mockContext);
  if (!retryResult.success) throw new Error(`Expected success for FAILED job: ${retryResult.error}`);
  if (retryResult.data.status !== 'PENDING') {
    throw new Error(`Expected retry output status PENDING, got ${retryResult.data.status}`);
  }
  console.log(
    `✓ Test 1 Passed: FAILED job reset to PENDING successfully (result status: ${retryResult.data.status}).\n`
  );

  // 2. COMPLETED job cannot be retried
  console.log('Test 2: COMPLETED job cannot be retried...');
  const completedJob = await createTestJob('COMPLETED');
  const retryCompletedResult = await toolGateway.executeTool(
    'retry_failed_job',
    { jobId: completedJob.id },
    mockContext
  );
  if (retryCompletedResult.success) {
    throw new Error('Expected retry of COMPLETED job to fail!');
  }
  console.log(`✓ Test 2 Passed: Rejected with error: "${retryCompletedResult.error}"\n`);

  // 3. PROCESSING job cannot be retried
  console.log('Test 3: PROCESSING job cannot be retried...');
  const processingJob = await createTestJob('PROCESSING');
  const retryProcessingResult = await toolGateway.executeTool(
    'retry_failed_job',
    { jobId: processingJob.id },
    mockContext
  );
  if (retryProcessingResult.success) {
    throw new Error('Expected retry of PROCESSING job to fail!');
  }
  console.log(`✓ Test 3 Passed: Rejected with error: "${retryProcessingResult.error}"\n`);

  // 4. PENDING job cannot be retried
  console.log('Test 4: PENDING job cannot be retried...');
  const pendingJob = await createTestJob('PENDING');
  const retryPendingResult = await toolGateway.executeTool('retry_failed_job', { jobId: pendingJob.id }, mockContext);
  if (retryPendingResult.success) {
    throw new Error('Expected retry of PENDING job to fail!');
  }
  console.log(`✓ Test 4 Passed: Rejected with error: "${retryPendingResult.error}"\n`);

  // 5. Non-existent job cannot be retried
  console.log('Test 5: Non-existent job cannot be retried...');
  const nonExistentResult = await toolGateway.executeTool(
    'retry_failed_job',
    { jobId: 'a0000000-0000-4000-8000-000000000000' },
    mockContext
  );
  if (nonExistentResult.success) {
    throw new Error('Expected retry of non-existent job to fail!');
  }
  console.log(`✓ Test 5 Passed: Rejected with error: "${nonExistentResult.error}"\n`);

  // 6. A rejected retry does not modify the original job
  console.log('Test 6: A rejected retry does not modify the original job...');
  const checkedCompleted = await aiJobRepo.findById(completedJob.id);
  if (checkedCompleted.status !== 'COMPLETED') {
    throw new Error(`Job status was modified! Expected COMPLETED, got ${checkedCompleted.status}`);
  }
  console.log('✓ Test 6 Passed: COMPLETED job remained in COMPLETED status.\n');

  // 7. Retry cannot change action/payload/content target
  console.log('Test 7: Retry cannot change action/payload/content target...');
  const checkedFailed = await aiJobRepo.findById(failedJob.id);
  if (checkedFailed.action_type !== 'GENERATE_SUMMARY') {
    throw new Error('Job action_type was altered!');
  }
  if (checkedFailed.content_type !== 'article') {
    throw new Error('Job content_type was altered!');
  }
  const meta = typeof checkedFailed.metadata === 'string' ? JSON.parse(checkedFailed.metadata) : checkedFailed.metadata;
  if (meta.originalField !== 'untouched') {
    throw new Error('Job metadata was altered!');
  }
  console.log('✓ Test 7 Passed: Job action, content target, and metadata are immutable during retry.\n');

  // --- ISSUE 2 TESTS ---

  // 8. GetContentItemTool no longer directly imports/calls repositories
  console.log('Test 8: GetContentItemTool does not import repositories...');
  const getContentFile = fs.readFileSync(
    path.join(__dirname, '../agents/tools/content/GetContentItemTool.ts'),
    'utf-8'
  );
  if (getContentFile.includes('Repository')) {
    throw new Error('GetContentItemTool still references Repository!');
  }
  console.log('✓ Test 8 Passed: Zero Repository references in GetContentItemTool.\n');

  // 9. SearchContentTool no longer directly imports/calls repositories
  console.log('Test 9: SearchContentTool does not import repositories...');
  const searchContentFile = fs.readFileSync(
    path.join(__dirname, '../agents/tools/content/SearchContentTool.ts'),
    'utf-8'
  );
  if (searchContentFile.includes('Repository')) {
    throw new Error('SearchContentTool still references Repository!');
  }
  console.log('✓ Test 9 Passed: Zero Repository references in SearchContentTool.\n');

  // 10. Both tools use the appropriate domain-service layer
  console.log('Test 10: Both tools execute through domain-service layer...');
  if (!getContentFile.includes('bhajanService') || !getContentFile.includes('articleService')) {
    throw new Error('GetContentItemTool does not use bhajanService or articleService!');
  }
  if (!searchContentFile.includes('bhajanService') || !searchContentFile.includes('articleService')) {
    throw new Error('SearchContentTool does not use bhajanService or articleService!');
  }

  // Functional execution check through domain services
  const searchResult = await toolGateway.executeTool(
    'search_content',
    { query: 'Ram', entityType: 'bhajan', limit: 3 },
    mockContext
  );
  if (!searchResult.success) {
    throw new Error(`SearchContentTool execution failed: ${searchResult.error}`);
  }
  console.log(
    `✓ Test 10 Passed: SearchContentTool executed cleanly via bhajanService. Total results: ${searchResult.data.total}\n`
  );

  console.log('=== ALL 10 REMEDIATION TESTS PASSED CLEANLY! ===');
  process.exit(0);
}

runRemediationVerification().catch((err) => {
  console.error('Remediation verification failed:', err);
  process.exit(1);
});
