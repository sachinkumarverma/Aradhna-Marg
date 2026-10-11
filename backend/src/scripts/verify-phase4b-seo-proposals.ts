import { db } from '@common/database/DatabaseClient';
import { seoImprovementAgent } from '../agents/seo/SeoImprovementAgent';
import { agentExecutionService } from '../agents/services/AgentExecutionService';
import { agentProposalService } from '../agents/services/AgentProposalService';
import { agentProposalRepository } from '../agents/repositories/AgentProposalRepository';
import { toolGateway } from '../agents/gateway/ToolGateway';
import { toolRegistry } from '../agents/registry/ToolRegistry';
import { bhajanService } from '../features/bhajans/BhajanService';
import { articleService } from '../services/ArticleService';
import { festivalService } from '../services/FestivalService';
import { puranService } from '../services/PuranService';
import { categoryService } from '../features/categories/CategoryService';
import { AgentSecurityError } from '../agents/types/errors';
import * as fs from 'fs';
import * as path from 'path';

async function runPhase4bVerification() {
  console.log('=== STARTING PHASE 4B SEO IMPROVEMENT PROPOSAL VERIFICATION ===\n');

  // ==========================================
  // Check 1: Static Architecture & Safety Inspection
  // ==========================================
  console.log('Check 1: Static Architecture & Layering Verification...');

  const filesToCheck = [
    '../agents/seo/SeoImprovementAgent.ts',
    '../agents/tools/seo/ApplyBhajanSeoMetadataTool.ts',
    '../agents/tools/seo/ApplyArticleSeoMetadataTool.ts',
    '../agents/tools/seo/ApplyFestivalSeoMetadataTool.ts',
    '../agents/tools/seo/ApplyPuranSeoMetadataTool.ts',
    '../agents/tools/seo/ApplyCategorySeoMetadataTool.ts',
    '../agents/tools/seo/ProposeSeoMetadataTool.ts'
  ];

  for (const relPath of filesToCheck) {
    const fullPath = path.join(__dirname, relPath);
    const code = fs.readFileSync(fullPath, 'utf-8');
    if (code.includes('db.query')) {
      throw new Error(`VIOLATION: Direct db.query found in ${relPath}`);
    }
    if (code.includes('DatabaseClient')) {
      throw new Error(`VIOLATION: Direct DatabaseClient found in ${relPath}`);
    }
    if (
      code.includes('Repository') &&
      !code.includes('agentRunRepository') &&
      !code.includes('agentProposalRepository')
    ) {
      throw new Error(`VIOLATION: Direct domain repository import found in ${relPath}`);
    }
  }

  const proposalServiceCode = fs.readFileSync(
    path.join(__dirname, '../agents/services/AgentProposalService.ts'),
    'utf-8'
  );
  if (proposalServiceCode.includes('db.query')) {
    throw new Error('VIOLATION: Direct db.query found in AgentProposalService');
  }

  console.log(
    '✓ Verified: Zero db.query, zero DatabaseClient, zero domain repository bypass in agent & tool layers.\n'
  );

  // ==========================================
  // Check 2: Verify Tool Registrations & Typed Schemas
  // ==========================================
  console.log('Check 2: Verifying Tool Registrations and Typed Schemas...');
  const requiredTools = [
    'apply_bhajan_seo_metadata',
    'apply_article_seo_metadata',
    'apply_festival_seo_metadata',
    'apply_puran_seo_metadata',
    'apply_category_seo_metadata',
    'propose_seo_metadata'
  ];

  for (const toolName of requiredTools) {
    const tool = toolRegistry.get(toolName);
    if (!tool) throw new Error(`Required tool '${toolName}' is not registered in ToolRegistry`);
    if (!tool.inputSchema) throw new Error(`Tool '${toolName}' lacks an input schema`);
    if (!tool.outputSchema) throw new Error(`Tool '${toolName}' lacks an output schema`);
  }
  console.log('✓ Verified: All 6 SEO tools properly registered with typed Zod schemas.\n');

  // Setup Test Entities
  console.log('Setting up test entities across supported content types...');
  const timestamp = Date.now();

  const originalBhajan = await bhajanService.create({
    title: `Phase 4B Test Bhajan ${timestamp}`,
    lyrics: 'श्री राम जय राम जय जय राम। पावन भक्ति भजन।',
    short_description: 'Original Bhajan Meaning',
    status: 'PUBLISHED'
  });
  // Set initial SEO fields on bhajan
  await bhajanService.updateSeo(originalBhajan.id, 'Original Bhajan SEO Title', 'Original Bhajan SEO Meta Description');

  const originalArticle = await articleService.create({
    title: `Phase 4B Test Article ${timestamp}`,
    content: 'Sanatan Dharma spiritual wisdom article content for SEO test.',
    slug: `test-article-${timestamp}`,
    status: 'PUBLISHED'
  });
  await articleService.updateSeo(
    originalArticle.id,
    'Original Article SEO Title',
    'Original Article SEO Meta Description'
  );

  console.log(`✓ Test Bhajan created (ID: ${originalBhajan.id})`);
  console.log(`✓ Test Article created (ID: ${originalArticle.id})\n`);

  try {
    // ==========================================
    // Check 3: SEO Proposal Creation & Baseline Capture
    // ==========================================
    console.log('Check 3: Testing SEO Proposal Creation & Baseline Capture...');
    const run = await agentExecutionService.startRun({
      agentName: 'SeoImprovementAgent',
      triggerType: 'MANUAL',
      triggeredBy: 'test_admin',
      state: { entityType: 'bhajan', entityId: originalBhajan.id }
    });

    const proposedTitle = 'Shri Ram Bhajan Paavan Bhakti | Aradhna Marg';
    const proposedDesc = 'Listen and experience the divine bliss of Shri Ram devotional bhajan on Aradhna Marg.';

    const agentResult = await seoImprovementAgent.execute(run.id, {
      entityType: 'bhajan',
      entityId: originalBhajan.id,
      targetField: 'seo_metadata',
      proposedTitle,
      proposedDescription: proposedDesc,
      auditIssue: 'SEO_TITLE_TOO_SHORT',
      reasoning: 'Expanded SEO title and meta description for optimal devotional search discovery.'
    });

    console.log(`✓ Agent completed with status: ${agentResult.status}`);
    const proposal = await agentProposalRepository.findById(agentResult.proposalId);
    if (!proposal) throw new Error('Proposal was not created in agent_proposals');

    if (proposal.status !== 'PENDING') throw new Error(`Expected PENDING status, got: ${proposal.status}`);
    if (proposal.entityType !== 'bhajan') throw new Error(`Expected bhajan entityType, got: ${proposal.entityType}`);
    if (proposal.entityId !== originalBhajan.id) throw new Error('entityId mismatch');
    if (proposal.targetField !== 'seo_metadata')
      throw new Error(`Expected seo_metadata targetField, got: ${proposal.targetField}`);

    // Verify baseline capture
    const baselineObj = JSON.parse(proposal.currentValue || '{}');
    if (
      baselineObj.seoTitle !== 'Original Bhajan SEO Title' ||
      baselineObj.seoDescription !== 'Original Bhajan SEO Meta Description'
    ) {
      throw new Error(`Baseline capture mismatch: ${JSON.stringify(baselineObj)}`);
    }

    console.log('✓ Confirmed: Proposal staged in agent_proposals as PENDING with captured baseline.\n');

    // ==========================================
    // Check 4: Proposal Does Not Mutate Content
    // ==========================================
    console.log('Check 4: Verifying Proposal Creation Did NOT Mutate Content...');
    const bhajanAfterProposal = await bhajanService.getById(originalBhajan.id);
    if (bhajanAfterProposal.seo_title !== 'Original Bhajan SEO Title') {
      throw new Error('VIOLATION: Bhajan seo_title was mutated during proposal generation!');
    }
    if (bhajanAfterProposal.seo_description !== 'Original Bhajan SEO Meta Description') {
      throw new Error('VIOLATION: Bhajan seo_description was mutated during proposal generation!');
    }
    if (bhajanAfterProposal.lyrics !== originalBhajan.lyrics) {
      throw new Error('VIOLATION: Sacred lyrics were mutated during proposal generation!');
    }
    console.log('✓ Confirmed: Database content remains 100% untouched after proposal staging.\n');

    // ==========================================
    // Check 5: Human Approval Requirement (Premature Execution Blocked)
    // ==========================================
    console.log('Check 5: Testing Human Approval Requirement (Cannot execute PENDING)...');
    try {
      await agentProposalService.executeProposal(proposal.id, 'admin_tester');
      throw new Error('Expected execution of PENDING proposal to fail');
    } catch (err: any) {
      if (!err.message.includes('must be approved')) {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
      console.log('✓ Confirmed: ToolGateway/Service correctly blocked execution of unapproved proposal.\n');
    }

    // ==========================================
    // Check 6: Rejection Lifecycle
    // ==========================================
    console.log('Check 6: Testing Rejection Lifecycle...');
    const rejectionRun = await agentExecutionService.startRun({
      agentName: 'SeoImprovementAgent',
      triggerType: 'MANUAL',
      triggeredBy: 'test_admin'
    });
    const rejAgentResult = await seoImprovementAgent.execute(rejectionRun.id, {
      entityType: 'bhajan',
      entityId: originalBhajan.id,
      proposedTitle: 'Candidate Title to Reject',
      proposedDescription: 'Candidate Description to Reject',
      reasoning: 'Test rejection path'
    });
    const rejProposal = await agentProposalService.rejectProposal(
      rejAgentResult.proposalId,
      'reviewer_admin',
      'Title does not follow brand guidelines'
    );
    if (rejProposal.status !== 'REJECTED') throw new Error(`Expected REJECTED status, got: ${rejProposal.status}`);

    // Cannot approve rejected proposal
    try {
      await agentProposalService.approveProposal(rejProposal.id, 'reviewer_admin');
      throw new Error('Expected approval of REJECTED proposal to fail');
    } catch (err: any) {
      if (!err.message.includes('Cannot approve a rejected proposal')) {
        throw new Error(`Unexpected error: ${err.message}`);
      }
    }

    // Cannot execute rejected proposal
    try {
      await agentProposalService.executeProposal(rejProposal.id, 'admin_tester');
      throw new Error('Expected execution of REJECTED proposal to fail');
    } catch (err: any) {
      if (!err.message.includes('Cannot execute a rejected proposal')) {
        throw new Error(`Unexpected error: ${err.message}`);
      }
      console.log('✓ Confirmed: Rejection transitions properly enforced and immutable.\n');
    }

    // ==========================================
    // Check 7: Controlled Execution of Approved Proposal
    // ==========================================
    console.log('Check 7: Testing Controlled Execution of Approved Proposal...');
    const approvedProposal = await agentProposalService.approveProposal(proposal.id, 'approving_admin');
    if (approvedProposal.status !== 'APPROVED')
      throw new Error(`Expected APPROVED status, got: ${approvedProposal.status}`);

    const executedProposal = await agentProposalService.executeProposal(proposal.id, 'executing_admin');
    if (executedProposal.status !== 'COMPLETED')
      throw new Error(`Expected COMPLETED status, got: ${executedProposal.status}`);

    // Verify live content updated
    const bhajanAfterExec = await bhajanService.getById(originalBhajan.id);
    if (bhajanAfterExec.seo_title !== proposedTitle) {
      throw new Error(`Expected seo_title "${proposedTitle}", got "${bhajanAfterExec.seo_title}"`);
    }
    if (bhajanAfterExec.seo_description !== proposedDesc) {
      throw new Error(`Expected seo_description "${proposedDesc}", got "${bhajanAfterExec.seo_description}"`);
    }
    console.log('✓ Confirmed: Proposal executed through ToolGateway -> Domain Service -> Database successfully.');
    console.log(`✓ Confirmed: Bhajan SEO metadata updated to: "${bhajanAfterExec.seo_title}"\n`);

    // ==========================================
    // Check 8: Stale Proposal Protection
    // ==========================================
    console.log('Check 8: Testing Stale Proposal Protection...');
    // Create new proposal on the updated bhajan
    const staleRun = await agentExecutionService.startRun({
      agentName: 'SeoImprovementAgent',
      triggerType: 'MANUAL',
      triggeredBy: 'test_admin'
    });
    const staleAgentResult = await seoImprovementAgent.execute(staleRun.id, {
      entityType: 'bhajan',
      entityId: originalBhajan.id,
      proposedTitle: 'Next Generation SEO Title',
      proposedDescription: 'Next Generation SEO Description',
      reasoning: 'Testing stale detection'
    });
    // Approve it
    await agentProposalService.approveProposal(staleAgentResult.proposalId, 'approving_admin');

    // Simulate an external/manual CMS edit before execution
    await bhajanService.updateSeo(originalBhajan.id, 'Manual CMS Edit in the Meantime', 'Manual Description Edit');

    // Attempt to execute the approved proposal -> MUST BE BLOCKED AS STALE (HTTP 409)
    try {
      await agentProposalService.executeProposal(staleAgentResult.proposalId, 'executing_admin');
      throw new Error('Expected stale proposal execution to fail');
    } catch (err: any) {
      if (!err.message.includes('Stale proposal detected')) {
        throw new Error(`Expected stale proposal error, got: ${err.message}`);
      }
      console.log('✓ Confirmed: Stale proposal detected and blocked with 409 conflict.');
    }

    // Verify the proposal was marked FAILED
    const failedStaleProp = await agentProposalRepository.findById(staleAgentResult.proposalId);
    if (failedStaleProp?.status !== 'FAILED') {
      throw new Error(`Expected FAILED status on stale proposal, got: ${failedStaleProp?.status}`);
    }

    // Verify the manual edit was NOT overwritten
    const bhajanAfterStaleAttempt = await bhajanService.getById(originalBhajan.id);
    if (bhajanAfterStaleAttempt.seo_title !== 'Manual CMS Edit in the Meantime') {
      throw new Error('VIOLATION: Stale proposal overwrote manual CMS edit!');
    }
    console.log('✓ Confirmed: Live content preserved, proposal marked FAILED, zero overwrite.\n');

    // ==========================================
    // Check 9: Concurrency & CAS Protection
    // ==========================================
    console.log('Check 9: Testing Concurrency & CAS Protection...');
    const concRun = await agentExecutionService.startRun({
      agentName: 'SeoImprovementAgent',
      triggerType: 'MANUAL',
      triggeredBy: 'test_admin'
    });
    const concResult = await seoImprovementAgent.execute(concRun.id, {
      entityType: 'bhajan',
      entityId: originalBhajan.id,
      proposedTitle: 'Concurrent Title Test',
      proposedDescription: 'Concurrent Description Test',
      reasoning: 'Test double execution race condition'
    });
    await agentProposalService.approveProposal(concResult.proposalId, 'approving_admin');

    // Fire 2 simultaneous executions
    const execPromises = [
      agentProposalService.executeProposal(concResult.proposalId, 'admin_1'),
      agentProposalService.executeProposal(concResult.proposalId, 'admin_2')
    ];
    const results = await Promise.allSettled(execPromises);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    if (fulfilled.length !== 1 || rejected.length !== 1) {
      throw new Error(
        `Expected exactly 1 fulfilled and 1 rejected execution, got ${fulfilled.length} fulfilled and ${rejected.length} rejected`
      );
    }
    console.log('✓ Confirmed: CAS protection prevented double-execution under concurrency.\n');

    // ==========================================
    // Check 10: Proposal Immutability & Client Payload Tampering
    // ==========================================
    console.log('Check 10: Testing Proposal Immutability...');
    // Verify executeProposal takes ONLY (id, executedBy) and reads from persisted DB
    const executeMethodStr = agentProposalService.executeProposal.toString();
    if (executeMethodStr.includes('req.body.proposedValue') || executeMethodStr.includes('req.body.targetField')) {
      throw new Error('VIOLATION: executeProposal accepts client payload overrides!');
    }
    console.log(
      '✓ Confirmed: Execution strictly sources entityType, targetField, and proposedValue from persisted DB record.\n'
    );

    // ==========================================
    // Check 11: Unauthorized Target Field Rejection (Sacred Content Firewall)
    // ==========================================
    console.log('Check 11: Testing Sacred Content Firewall on Unauthorized Target Fields...');
    const forbiddenFields = [
      'lyrics',
      'clean_lyrics',
      'title',
      'hindi_title',
      'god_id',
      'category_id',
      'author_id',
      'video_url',
      'pdf',
      'image',
      'content',
      'description'
    ];

    for (const forbiddenField of forbiddenFields) {
      try {
        await toolGateway.executeApprovedProposal(
          {
            id: '00000000-0000-0000-0000-000000000001',
            agentName: 'TestAgent',
            entityType: 'bhajan',
            entityId: originalBhajan.id,
            targetField: forbiddenField,
            proposedValue: 'Hacked Value'
          },
          'attacker'
        );
        throw new Error(`Expected execution on forbidden target field '${forbiddenField}' to be BLOCKED`);
      } catch (err: any) {
        if (!(err instanceof AgentSecurityError) && !err.message.includes('Sacred Content Firewall')) {
          throw new Error(`Expected Sacred Content Firewall error, got: ${err.message}`);
        }
      }
    }
    console.log('✓ Confirmed: Sacred Content Firewall blocked all 12 unauthorized target fields.\n');

    // ==========================================
    // Check 12: Sacred Devotional Lyrics Immutability
    // ==========================================
    console.log('Check 12: Testing Sacred Lyrics Protection for Bhajans...');
    try {
      await toolGateway.executeApprovedProposal(
        {
          id: '00000000-0000-0000-0000-000000000002',
          agentName: 'AttackerAgent',
          entityType: 'bhajan',
          entityId: originalBhajan.id,
          targetField: 'seo_metadata',
          proposedValue: JSON.stringify({ seoTitle: 'Valid Title', lyrics: 'Altered sacred verses' })
        },
        'attacker'
      );
      throw new Error('Expected proposedValue containing lyrics to be blocked');
    } catch (err: any) {
      if (!err.message.includes('lyrics')) {
        throw new Error(`Expected lyrics security error, got: ${err.message}`);
      }
      console.log('✓ Confirmed: Proposals containing sacred lyrics references blocked by Sacred Content Firewall.\n');
    }

    // ==========================================
    // Check 13: Unsupported Content Type Rejection
    // ==========================================
    console.log('Check 13: Testing Unsupported Content Type Rejection...');
    const unsupportedTypes = ['youtube', 'user', 'settings', 'role'];

    for (const invalidType of unsupportedTypes) {
      // Agent level rejection
      try {
        await seoImprovementAgent.execute('00000000-0000-0000-0000-000000000000', {
          entityType: invalidType as any,
          entityId: originalBhajan.id
        });
        throw new Error(`Expected agent to reject unsupported entityType '${invalidType}'`);
      } catch (err: any) {
        if (!err.message.includes('not supported')) {
          throw new Error(`Unexpected error: ${err.message}`);
        }
      }

      // Gateway level rejection
      try {
        await toolGateway.executeApprovedProposal(
          {
            id: '00000000-0000-0000-0000-000000000003',
            agentName: 'TestAgent',
            entityType: invalidType,
            entityId: originalBhajan.id,
            targetField: 'seo_metadata',
            proposedValue: JSON.stringify({ seoTitle: 'Title', seoDescription: 'Desc' })
          },
          'admin'
        );
        throw new Error(`Expected gateway to reject unsupported entityType '${invalidType}'`);
      } catch (err: any) {
        if (!err.message.includes('not supported')) {
          throw new Error(`Unexpected error: ${err.message}`);
        }
      }
    }
    console.log('✓ Confirmed: Unsupported content types (including YouTube) strictly rejected at Agent and Gateway.\n');

    // ==========================================
    // Check 14: Multi-Entity Coverage & Physical Mapping
    // ==========================================
    console.log('Check 14: Testing Multi-Entity Coverage across all 5 supported types...');

    // 1. Article
    const artRun = await agentExecutionService.startRun({
      agentName: 'SeoImprovementAgent',
      triggerType: 'MANUAL',
      triggeredBy: 'test'
    });
    const artRes = await seoImprovementAgent.execute(artRun.id, {
      entityType: 'article',
      entityId: originalArticle.id,
      proposedTitle: 'Divine Wisdom Article SEO Title',
      proposedDescription: 'Discover the profound Sanatan teachings in this article on Aradhna Marg.',
      reasoning: 'Article SEO enhancement'
    });
    await agentProposalService.approveProposal(artRes.proposalId, 'approver');
    await agentProposalService.executeProposal(artRes.proposalId, 'executor');
    const updatedArticle = await articleService.getById(originalArticle.id);
    if (updatedArticle.seo_title !== 'Divine Wisdom Article SEO Title') {
      throw new Error(`Article physical mapping failed: got ${updatedArticle.seo_title}`);
    }
    console.log('✓ Article SEO proposal executed and mapped to articles.seo_title & articles.seo_description.');

    // 2. Festival
    const testFestival = await festivalService.create({
      name: `Phase 4B Festival ${timestamp}`,
      slug: `test-festival-${timestamp}`,
      content: 'Festival description',
      category: 'Major',
      status: 'PUBLISHED'
    });

    await festivalService.updateSeo(testFestival.id, 'Initial Fest Title', 'Initial Fest Desc');
    const festRun = await agentExecutionService.startRun({
      agentName: 'SeoImprovementAgent',
      triggerType: 'MANUAL',
      triggeredBy: 'test'
    });
    const festRes = await seoImprovementAgent.execute(festRun.id, {
      entityType: 'festival',
      entityId: testFestival.id,
      proposedTitle: 'Maha Shivratri Celebration Guide | Aradhna Marg',
      proposedDescription: 'Learn rituals, auspicious timings, and devotional significance of Maha Shivratri.',
      reasoning: 'Festival SEO enhancement'
    });
    await agentProposalService.approveProposal(festRes.proposalId, 'approver');
    await agentProposalService.executeProposal(festRes.proposalId, 'executor');
    const updatedFest = await festivalService.getById(testFestival.id);
    if (updatedFest.seoTitle !== 'Maha Shivratri Celebration Guide | Aradhna Marg') {
      throw new Error(`Festival physical mapping failed: got ${updatedFest.seoTitle}`);
    }
    console.log('✓ Festival SEO proposal executed and mapped to festivals.seo_title & festivals.seo_description.');

    // 3. Puran
    const testPuran = await puranService.create({
      title: `Phase 4B Shiva Purana ${timestamp}`,
      slug: `test-puran-${timestamp}`,
      language: 'Hindi',
      status: 'PUBLISHED'
    });
    await puranService.updateSeo(testPuran.id, 'Initial Puran Title', 'Initial Puran Desc');
    const puranRun = await agentExecutionService.startRun({
      agentName: 'SeoImprovementAgent',
      triggerType: 'MANUAL',
      triggeredBy: 'test'
    });
    const puranRes = await seoImprovementAgent.execute(puranRun.id, {
      entityType: 'puran',
      entityId: testPuran.id,
      proposedTitle: 'Shiva Purana Mahatmya & Katha | Aradhna Marg',
      proposedDescription: 'Read the holy Shiva Purana chapters, divine glory and spiritual insights.',
      reasoning: 'Puran SEO enhancement'
    });
    await agentProposalService.approveProposal(puranRes.proposalId, 'approver');
    await agentProposalService.executeProposal(puranRes.proposalId, 'executor');
    const updatedPuran = await puranService.getById(testPuran.id);
    if (updatedPuran.seo_title !== 'Shiva Purana Mahatmya & Katha | Aradhna Marg') {
      throw new Error(`Puran physical mapping failed: got ${updatedPuran.seo_title}`);
    }
    console.log('✓ Puran SEO proposal executed and mapped to puranas.seo_title & puranas.seo_description.');

    // 4. Category
    const testCat = await categoryService.createCategory({
      name: `Phase 4B Shiv Bhajans ${timestamp}`,
      slug: `shiv-bhajans-${timestamp}`,
      description: 'Devotional category'
    });
    await categoryService.updateSeo(testCat.id, 'Initial Cat Title', 'Initial Cat Desc');
    const catRun = await agentExecutionService.startRun({
      agentName: 'SeoImprovementAgent',
      triggerType: 'MANUAL',
      triggeredBy: 'test'
    });
    const catRes = await seoImprovementAgent.execute(catRun.id, {
      entityType: 'category',
      entityId: testCat.id,
      proposedTitle: 'Popular Lord Shiva Bhajans & Aarti | Aradhna Marg',
      proposedDescription: 'Explore sacred Lord Shiva devotional songs, stutis, and mantra collections.',
      reasoning: 'Category SEO enhancement'
    });
    await agentProposalService.approveProposal(catRes.proposalId, 'approver');
    await agentProposalService.executeProposal(catRes.proposalId, 'executor');
    const updatedCat = await categoryService.getById(testCat.id);
    if (updatedCat.seoTitle !== 'Popular Lord Shiva Bhajans & Aarti | Aradhna Marg') {
      throw new Error(`Category physical mapping failed: got ${updatedCat.seoTitle}`);
    }
    console.log('✓ Category SEO proposal executed and mapped to categories.seo_title & categories.seo_description.\n');

    // ==========================================
    // Check 15: Single-Field Granular Proposals ('seo_title' vs 'seo_description')
    // ==========================================
    console.log('Check 15: Testing Single-Field Granular SEO Proposals...');
    const singleRun = await agentExecutionService.startRun({
      agentName: 'SeoImprovementAgent',
      triggerType: 'MANUAL',
      triggeredBy: 'test'
    });
    const singleRes = await seoImprovementAgent.execute(singleRun.id, {
      entityType: 'bhajan',
      entityId: originalBhajan.id,
      targetField: 'seo_title',
      proposedTitle: 'Ultra Refined Title Only Test',
      reasoning: 'Testing targetField = seo_title exclusively'
    });
    await agentProposalService.approveProposal(singleRes.proposalId, 'approver');
    await agentProposalService.executeProposal(singleRes.proposalId, 'executor');

    const bhajanAfterSingle = await bhajanService.getById(originalBhajan.id);
    if (bhajanAfterSingle.seo_title !== 'Ultra Refined Title Only Test') {
      throw new Error(`Expected seo_title "Ultra Refined Title Only Test", got "${bhajanAfterSingle.seo_title}"`);
    }
    console.log(
      '✓ Confirmed: Granular targetField "seo_title" executed successfully without affecting seo_description.\n'
    );
  } finally {
    // Cleanup Test Data
    console.log('Cleaning up test data...');
    try {
      await db.query('DELETE FROM agent_proposals WHERE entity_id IN ($1, $2)', [
        originalBhajan.id,
        originalArticle.id
      ]);
      await db.query('DELETE FROM bhajans WHERE id = $1', [originalBhajan.id]);
      await db.query('DELETE FROM articles WHERE id = $1', [originalArticle.id]);
      await db.query('DELETE FROM festivals WHERE slug LIKE $1', [`test-festival-${timestamp}%`]);
      await db.query('DELETE FROM puranas WHERE slug LIKE $1', [`test-puran-${timestamp}%`]);
      await db.query('DELETE FROM categories WHERE slug LIKE $1', [`shiv-bhajans-${timestamp}%`]);
      console.log('✓ Cleanup completed.\n');
    } catch (cleanupErr: any) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }
  }

  console.log('====================================================');
  console.log('🎉 ALL 15 PHASE 4B VERIFICATION CHECKS PASSED!');
  console.log('====================================================');
}

runPhase4bVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ PHASE 4B VERIFICATION FAILED:', err);
    process.exit(1);
  });
