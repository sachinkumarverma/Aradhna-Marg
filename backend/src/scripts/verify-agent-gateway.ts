import { toolRegistry, toolGateway } from '../agents';
import { agentRunRepository } from '../agents/repositories/AgentRunRepository';
import { AgentPermissionTier } from '../agents/types/AgentPermissionTier';
import { AgentContext } from '../agents/types/AgentContext';
import {
  AgentSecurityError,
  ToolNotFoundError,
  ToolValidationError,
  AgentIterationLimitError
} from '../agents/types/errors';
import { getContentItemTool } from '../agents/tools/content/GetContentItemTool';
import { z } from 'zod';

async function runVerification() {
  console.log('=== STARTING AGENT GATEWAY & TOOL CONTRACTS VERIFICATION ===\n');

  // Test 1: Tool Registry Registration
  console.log('Test 1: Tool Registry has registered tools...');
  const tools = toolRegistry.getAll();
  console.log(`Registered tools count: ${tools.length}`);
  if (tools.length === 0) throw new Error('Tool registry is empty!');
  const toolNames = tools.map((t) => t.name);
  console.log(`Tools: ${toolNames.join(', ')}`);
  if (!toolRegistry.has('get_content_item')) throw new Error('get_content_item not registered');
  if (!toolRegistry.has('get_seo_audit')) throw new Error('get_seo_audit not registered');
  if (!toolRegistry.has('propose_seo_metadata')) throw new Error('propose_seo_metadata not registered');
  console.log('✓ Test 1 Passed\n');

  console.log('Creating real agent run for test execution...');
  const run = await agentRunRepository.create({
    agentName: 'VerificationAgent',
    triggerType: 'MANUAL',
    triggeredBy: 'test_admin'
  });
  console.log(`Created test AgentRun ID: ${run.id}\n`);

  const mockContext: AgentContext = {
    runId: run.id,
    agentName: 'VerificationAgent',
    actor: { type: 'ADMIN', id: 'test_admin' },
    currentIteration: 0,
    maxIterations: 5,
    tokensUsed: 0,
    tokenBudget: 10000
  };

  // Test 2: Unregistered tool lookup throws ToolNotFoundError
  console.log('Test 2: Unregistered tool throws ToolNotFoundError...');
  try {
    await toolGateway.executeTool('non_existent_tool', {}, mockContext);
    throw new Error('Should have thrown ToolNotFoundError');
  } catch (err: any) {
    if (err instanceof ToolNotFoundError) {
      console.log(`✓ Caught expected ToolNotFoundError: ${err.message}`);
    } else {
      throw err;
    }
  }
  console.log('✓ Test 2 Passed\n');

  // Test 3: Input schema validation failure
  console.log('Test 3: Invalid input fails Zod schema validation...');
  try {
    // get_content_item requires uuid and valid entityType
    await toolGateway.executeTool('get_content_item', { entityType: 'invalid_type', id: 'not-a-uuid' }, mockContext);
    throw new Error('Should have thrown ToolValidationError');
  } catch (err: any) {
    if (err instanceof ToolValidationError) {
      console.log(`✓ Caught expected ToolValidationError: ${err.message}`);
    } else {
      throw err;
    }
  }
  console.log('✓ Test 3 Passed\n');

  // Test 4: Sacred Content Guardrail - Modifying lyrics is strictly blocked
  console.log('Test 4: Sacred Content Guardrail blocks lyrics modification...');
  try {
    await toolGateway.executeTool(
      'get_content_item',
      { entityType: 'bhajan', id: '00000000-0000-0000-0000-000000000002', lyrics: 'malicious change' },
      mockContext
    );
    throw new Error('Should have thrown AgentSecurityError for lyrics');
  } catch (err: any) {
    if (err instanceof AgentSecurityError) {
      console.log(`✓ Caught expected AgentSecurityError: ${err.message}`);
    } else {
      throw err;
    }
  }
  console.log('✓ Test 4 Passed\n');

  // Test 5: Tier 6 Destructive tool is blocked
  console.log('Test 5: Tier 6 Destructive tool is blocked autonomously...');
  const destructiveTool = {
    name: 'delete_database_records',
    description: 'Deletes production records',
    inputSchema: z.object({}),
    outputSchema: z.object({}),
    permission: AgentPermissionTier.TIER_6_DESTRUCTIVE,
    requiresApproval: true,
    handler: async () => ({})
  };
  toolRegistry.register(destructiveTool);

  try {
    await toolGateway.executeTool('delete_database_records', {}, mockContext);
    throw new Error('Should have thrown AgentSecurityError for Tier 6');
  } catch (err: any) {
    if (err instanceof AgentSecurityError) {
      console.log(`✓ Caught expected AgentSecurityError: ${err.message}`);
    } else {
      throw err;
    }
  }
  console.log('✓ Test 5 Passed\n');

  // Test 6: Iteration limit guardrail
  console.log('Test 6: Loop iteration limit guardrail...');
  const exhaustedContext: AgentContext = {
    ...mockContext,
    currentIteration: 5,
    maxIterations: 5
  };
  try {
    await toolGateway.executeTool('get_seo_audit', {}, exhaustedContext);
    throw new Error('Should have thrown AgentIterationLimitError');
  } catch (err: any) {
    if (err instanceof AgentIterationLimitError) {
      console.log(`✓ Caught expected AgentIterationLimitError: ${err.message}`);
    } else {
      throw err;
    }
  }
  console.log('✓ Test 6 Passed\n');

  console.log('=== ALL AGENT GATEWAY & TOOL CONTRACT TESTS PASSED! ===');
  process.exit(0);
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
