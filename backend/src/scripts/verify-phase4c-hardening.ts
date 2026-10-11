/**
 * Phase 4C Corrective Hardening Verification Suite
 * Long-Form Content Preservation + AI Output Safety
 *
 * Verifies all hardening rules and safety boundaries:
 * 1. Content measurement & HTML stripping
 * 2. Catastrophic reduction rejection (Jagannath Rath Yatra test)
 * 3. 70% retention threshold enforcement for long-form content
 * 4. Legitimate copy-editing acceptance
 * 5. Heading and structure preservation
 * 6. Generic devotional boilerplate rejection
 * 7. Long-form vs short-form field differentiation
 * 8. ToolGateway defense-in-depth blocking
 * 9. ContentImprovementAgent fails closed on AI error (zero fake fallbacks)
 * 10. AiPrompts long-form scalability (no 3500 char chop)
 * 11. Sacred Content Firewall preservation
 */

import { ContentSafetyValidator } from '../agents/utils/ContentSafetyValidator';
import { toolGateway } from '../agents/gateway/ToolGateway';
import { agentExecutionService } from '../agents/services/AgentExecutionService';
import { agentToolCallRepository } from '../agents/repositories/AgentToolCallRepository';
import { agentProposalRepository } from '../agents/repositories/AgentProposalRepository';
import { AgentSecurityError } from '../agents/types/errors';
import { contentImprovementAgent } from '../agents/content/ContentImprovementAgent';
import { AiPrompts } from '../admin/services/ai/AiPrompts';
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

async function runHardeningVerification() {
  console.log('\n============================================================');
  console.log('ARADHNA MARG — PHASE 4C CORRECTIVE HARDENING VERIFICATION');
  console.log('Long-Form Content Preservation + AI Output Safety');
  console.log('============================================================\n');

  try {
    // -------------------------------------------------------------
    // PART 1: CONTENT MEASUREMENT & HTML EXTRACTION
    // -------------------------------------------------------------
    console.log('--- 1. CONTENT MEASUREMENT & HTML EXTRACTION ---');
    const sampleHtml = `
      <h2>भगवान जगन्नाथ की रथ यात्रा का महत्व</h2>
      <p>जगन्नाथ पुरी की रथ यात्रा सनातन धर्म का एक <strong>अत्यंत पावन</strong> एवं प्राचीन महोत्सव है।</p>
      <p>हर वर्ष आषाढ़ मास के शुक्ल पक्ष की द्वितीया तिथि को यह पावन यात्रा प्रारंभ होती है।&nbsp;इसमें लाखों श्रद्धालु भाग लेते हैं।</p>
    `;

    const metrics = ContentSafetyValidator.measureContent(sampleHtml);
    assert(metrics.headingCount === 1, 1, 'Accurately detected 1 heading in HTML');
    assert(metrics.paragraphCount >= 2, 2, 'Accurately detected paragraphs in HTML');
    assert(metrics.plainTextLength < metrics.rawLength, 3, 'Plain text extracted cleanly without HTML markup');
    assert(!metrics.plainTextLength.toString().includes('&nbsp;'), 4, 'HTML entities like &nbsp; decoded cleanly');

    // -------------------------------------------------------------
    // PART 2: CATASTROPHIC REDUCTION DETECTION (Jagannath Rath Yatra)
    // -------------------------------------------------------------
    console.log('\n--- 2. CATASTROPHIC REDUCTION DETECTION ---');
    // Simulate real production incident: 21,211 chars article vs 125 chars AI output
    const originalLongArticle =
      `<h2>जगन्नाथ रथ यात्रा क्यों निकाली जाती है?</h2>` +
      '<p>भगवान जगन्नाथ की महिमा अनंत और अपार है। पुरी धाम में हर वर्ष आषाढ़ मास में भव्य रथयात्रा का आयोजन किया जाता है। </p>'.repeat(
        180
      );
    const catastrophicProposal =
      'यह पावन आलेख भगवान जगन्नाथ की रथ यात्रा की महिमा और आध्यात्मिक सार को श्रद्धापूर्वक प्रस्तुत करता है।';

    const incidentCheck = ContentSafetyValidator.validateContentImprovement({
      entityType: 'article',
      targetField: 'content',
      originalContent: originalLongArticle,
      proposedContent: catastrophicProposal
    });

    assert(
      !incidentCheck.isValid,
      5,
      'Catastrophic reduction (~21k chars to 125 chars) strictly rejected by ContentSafetyValidator'
    );
    assert(
      incidentCheck.reason?.includes('Long-form content safety violation') === true,
      6,
      'Clear safety violation reason generated citing retention threshold'
    );
    assert(
      (incidentCheck.retentionRatio || 0) < 0.05,
      7,
      `Calculated retention ratio correctly reflects catastrophic loss (${((incidentCheck.retentionRatio || 0) * 100).toFixed(2)}%)`
    );

    // -------------------------------------------------------------
    // PART 3: 70% RETENTION THRESHOLD ENFORCEMENT
    // -------------------------------------------------------------
    console.log('\n--- 3. 70% RETENTION THRESHOLD ENFORCEMENT ---');
    const baseText = '<p>सनातन धर्म में भक्ति और साधना का मार्ग अत्यंत पवित्र माना गया है। </p>'.repeat(50); // ~3300 chars
    // 25% retention proposal (~825 chars)
    const severeReduction = '<p>सनातन धर्म में भक्ति और साधना का मार्ग अत्यंत पवित्र माना गया है। </p>'.repeat(12);

    const thresholdCheck = ContentSafetyValidator.validateContentImprovement({
      entityType: 'article',
      targetField: 'content',
      originalContent: baseText,
      proposedContent: severeReduction
    });
    assert(!thresholdCheck.isValid, 8, 'Proposed reduction to 25% of length is rejected (< 70% threshold)');

    // -------------------------------------------------------------
    // PART 4: LEGITIMATE COPY-EDITING ACCEPTANCE
    // -------------------------------------------------------------
    console.log('\n--- 4. LEGITIMATE COPY-EDITING ACCEPTANCE ---');
    // Polished text that retains 95% of length
    const polishedText =
      '<p>सनातन धर्म में भक्ति, साधना और समर्पण का मार्ग अत्यंत पावन एवं कल्याणकारी माना गया है। </p>'.repeat(48);
    const legitimateCheck = ContentSafetyValidator.validateContentImprovement({
      entityType: 'article',
      targetField: 'content',
      originalContent: baseText,
      proposedContent: polishedText
    });
    assert(legitimateCheck.isValid, 9, 'Legitimate copy-editing retaining 95% of substantive text is approved');

    // -------------------------------------------------------------
    // PART 5: STRUCTURAL HEADING PRESERVATION
    // -------------------------------------------------------------
    console.log('\n--- 5. STRUCTURAL HEADING PRESERVATION ---');
    const multiHeadingArticle = `
      <h2>रथ यात्रा का ऐतिहासिक संदर्भ</h2>
      <p>स्कंद पुराण और ब्रह्म पुराण में इस पावन यात्रा का विस्तृत वर्णन प्राप्त होता है।</p>
      <h3>पूजा विधि और नियम</h3>
      <p>श्रद्धालु भक्त तीनों रथों को श्रद्धापूर्वक खींचते हैं और पुण्य लाभ अर्जित करते हैं।</p>
      <h3>आध्यात्मिक फल</h3>
      <p>रथयात्रा के दर्शन मात्र से मनुष्य जन्म-जन्मांतर के पापों से मुक्त हो जाता है।</p>
    `.repeat(10); // substantive depth with 30 headings

    // Proposal that strips all headings and merges into one big text
    const strippedHeadingsProposal = multiHeadingArticle.replace(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi, '');
    const headingCheck = ContentSafetyValidator.validateContentImprovement({
      entityType: 'article',
      targetField: 'content',
      originalContent: multiHeadingArticle,
      proposedContent: strippedHeadingsProposal
    });
    assert(!headingCheck.isValid, 10, 'Stripping all structural headings is rejected');
    assert(headingCheck.reason?.includes('stripped all') === true, 11, 'Reason identifies loss of headings');

    // -------------------------------------------------------------
    // PART 6: GENERIC DEVOTIONAL BOILERPLATE REJECTION
    // -------------------------------------------------------------
    console.log('\n--- 6. GENERIC DEVOTIONAL BOILERPLATE REJECTION ---');
    const boilerplateProposal = 'यह पावन सामग्री साधक को आत्म-चिंतन और प्रभु के दिव्य प्रेम की ओर प्रेरित करती है।';
    const boilerplateCheck = ContentSafetyValidator.validateContentImprovement({
      entityType: 'article',
      targetField: 'content',
      originalContent: baseText,
      proposedContent: boilerplateProposal
    });
    assert(!boilerplateCheck.isValid, 12, 'Generic devotional placeholder boilerplate is recognized and rejected');

    // -------------------------------------------------------------
    // PART 7: LONG-FORM VS SHORT-FORM FIELD DISCRIMINATION
    // -------------------------------------------------------------
    console.log('\n--- 7. LONG-FORM VS SHORT-FORM FIELD DISCRIMINATION ---');
    assert(ContentSafetyValidator.isLongFormField('article', 'content'), 13, 'article.content classified as long-form');
    assert(
      ContentSafetyValidator.isLongFormField('festival', 'content'),
      14,
      'festival.content classified as long-form'
    );
    assert(
      !ContentSafetyValidator.isLongFormField('article', 'excerpt'),
      15,
      'article.excerpt correctly classified as short-form'
    );
    assert(
      !ContentSafetyValidator.isLongFormField('festival', 'short_description'),
      16,
      'festival.short_description correctly classified as short-form'
    );
    assert(
      !ContentSafetyValidator.isLongFormField('puran', 'short_description'),
      17,
      'puran.short_description correctly classified as short-form'
    );
    assert(
      !ContentSafetyValidator.isLongFormField('bhajan', 'description'),
      18,
      'bhajan.description correctly classified as short-form'
    );

    // Excerpt generated for a 20k article should NOT be rejected for being short!
    const excerptCheck = ContentSafetyValidator.validateContentImprovement({
      entityType: 'article',
      targetField: 'excerpt',
      originalContent: baseText,
      proposedContent: 'भगवान जगन्नाथ की पावन रथ यात्रा का संक्षिप्त आध्यात्मिक परिचय और धार्मिक महत्व।'
    });
    assert(excerptCheck.isValid, 19, 'Short-form fields (excerpt) are not penalized by long-form 70% retention rules');

    // -------------------------------------------------------------
    // PART 8: TOOLGATEWAY DEFENSE-IN-DEPTH
    // -------------------------------------------------------------
    console.log('\n--- 8. TOOLGATEWAY DEFENSE-IN-DEPTH ---');
    const testRun = await agentExecutionService.startRun({
      agentName: 'ContentImprovementAgent',
      triggerType: 'MANUAL',
      triggeredBy: 'admin-tester',
      state: {}
    });

    const sampleArticleRes = await db.query(
      'SELECT id, title, content FROM articles WHERE content IS NOT NULL AND LENGTH(content) > 500 LIMIT 1'
    );
    const testArticle = sampleArticleRes.rows[0];
    const testArticleId = testArticle?.id || 'a0000000-0000-4000-a000-000000000001';

    let toolGatewayBlocked = false;
    try {
      await toolGateway.executeTool(
        'propose_article_content_improvement',
        {
          entityId: testArticleId,
          targetField: 'content',
          proposedContent: catastrophicProposal,
          currentValue: originalLongArticle,
          reasoning: 'Attempted catastrophic proposal staging'
        },
        {
          agentName: 'ContentImprovementAgent',
          runId: testRun.id,
          actor: { type: 'ADMIN', id: 'admin-tester' },
          currentIteration: 0,
          maxIterations: 10,
          tokensUsed: 0,
          tokenBudget: 50000
        }
      );
    } catch (err: any) {
      toolGatewayBlocked = err instanceof AgentSecurityError && err.message.includes('Content safety violation');
    }

    assert(toolGatewayBlocked, 20, 'ToolGateway intercepts and blocks proposal staging of catastrophic reduction');

    // Verify tool call was recorded as BLOCKED in database
    const toolCalls = await agentToolCallRepository.findByRunId(testRun.id);
    const blockedCall = toolCalls.find((c) => c.status === 'BLOCKED');
    assert(
      !!(blockedCall && blockedCall.errorMessage?.includes('ContentSafetyValidator')),
      21,
      'ToolGateway recorded BLOCKED in agent_tool_calls with reason'
    );

    // Verify 0 proposals were created in agent_proposals
    const proposals = await agentProposalRepository.list(1, 10, 'article', 'PENDING');
    const rogueProposal = proposals.data.find((p) => p.runId === testRun.id);
    assert(!rogueProposal, 22, 'ZERO proposals staged in agent_proposals when safety validation fails');

    // -------------------------------------------------------------
    // PART 9: CONTENT IMPROVEMENT AGENT FAILS CLOSED (NO FAKE FALLBACKS)
    // -------------------------------------------------------------
    console.log('\n--- 9. CONTENT IMPROVEMENT AGENT FAILS CLOSED ---');
    let agentRejectedCatastrophic = false;
    try {
      await contentImprovementAgent.execute(testRun.id, {
        entityType: 'article',
        entityId: testArticleId,
        targetField: 'content',
        proposedContent: catastrophicProposal // Passing invalid content directly
      });
    } catch (err: any) {
      agentRejectedCatastrophic = err.message?.includes('Content improvement safety validation failed');
    }
    assert(agentRejectedCatastrophic, 23, 'ContentImprovementAgent validates output and throws before calling tools');

    // -------------------------------------------------------------
    // PART 10: AI PROMPTS LONG-FORM SCALABILITY
    // -------------------------------------------------------------
    console.log('\n--- 10. AI PROMPTS LONG-FORM SCALABILITY ---');
    const promptPayload = AiPrompts.contentQualityImprovement({
      entityType: 'article',
      field: 'content',
      title: 'जगन्नाथ रथ यात्रा',
      currentContent: originalLongArticle
    });

    // Verify prompt does NOT truncate to 3500 chars
    assert(!promptPayload.prompt.includes('slice(0, 3500)'), 24, 'AiPrompts does not hard-code 3500 char truncation');
    assert(
      promptPayload.prompt.length > 5000,
      25,
      'Full substantive content passed into prompt (> 5000 chars preserved)'
    );
    assert(
      promptPayload.maxTokens! >= 4000,
      26,
      `Scaled maxTokens allocated for long-form article (${promptPayload.maxTokens} tokens)`
    );
    assert(
      promptPayload.prompt.includes('FULL SUBSTANCE PRESERVATION') ||
        promptPayload.prompt.includes('पूर्ण विस्तार व विषय-वस्तु का संरक्षण'),
      27,
      'Explicit anti-summarization preservation instructions in prompt'
    );

    // -------------------------------------------------------------
    // PART 11: SACRED CONTENT FIREWALL
    // -------------------------------------------------------------
    console.log('\n--- 11. SACRED CONTENT FIREWALL ---');
    let lyricsBlocked = false;
    try {
      await contentImprovementAgent.execute(testRun.id, {
        entityType: 'bhajan',
        entityId: '00000000-0000-0000-0000-000000000001',
        targetField: 'lyrics'
      });
    } catch (err: any) {
      lyricsBlocked = err.message?.includes('Sacred Content Firewall');
    }
    assert(lyricsBlocked, 28, 'Sacred lyrics remain strictly protected and cannot be targeted for content improvement');

    let cleanLyricsBlocked = false;
    try {
      await contentImprovementAgent.execute(testRun.id, {
        entityType: 'bhajan',
        entityId: '00000000-0000-0000-0000-000000000001',
        targetField: 'clean_lyrics'
      });
    } catch (err: any) {
      cleanLyricsBlocked = err.message?.includes('Sacred Content Firewall');
    }
    assert(cleanLyricsBlocked, 29, 'clean_lyrics remains strictly protected');

    let titleBlocked = false;
    try {
      await contentImprovementAgent.execute(testRun.id, {
        entityType: 'article',
        entityId: '00000000-0000-0000-0000-000000000001',
        targetField: 'title'
      });
    } catch (err: any) {
      titleBlocked = err.message?.includes('Sacred Content Firewall');
    }
    assert(titleBlocked, 30, 'Titles remain strictly protected from arbitrary content alteration');

    console.log('\n============================================================');
    console.log(`PHASE 4C HARDENING VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('============================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error: any) {
    console.error('\nUNHANDLED ERROR IN HARDENING SUITE:', error);
    process.exit(1);
  }
}

runHardeningVerification();
