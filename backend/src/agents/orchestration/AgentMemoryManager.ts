import { AgentContext, AgentStepRecord, AgentStepEvaluation, AgentPlanStep } from '../types/AgentContext';
import { AgentLoopDetectedError } from '../types/errors';

export class AgentMemoryManager {
  private static readonly MAX_HISTORY_ITEMS = 50;

  /**
   * Redacts sensitive keys before storing payloads in memory.
   */
  public static redactSecrets(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.redactSecrets(item));
    const redacted: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (/password|secret|token|apiKey|api_key|auth|cookie|jwt/i.test(key)) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = this.redactSecrets(value);
      } else {
        redacted[key] = value;
      }
    }
    return redacted;
  }

  /**
   * Generates a deterministic signature string for a tool invocation.
   */
  public static computeToolSignature(toolName: string, inputPayload: any): string {
    const cleanPayload = this.redactSecrets(inputPayload || {});
    // Sort keys to produce deterministic serialization
    const canonicalJson = JSON.stringify(cleanPayload, Object.keys(cleanPayload).sort());
    return `${toolName}:${canonicalJson}`;
  }

  /**
   * Server-side deterministic loop / cycle protection.
   * Detects:
   * 1. Consecutive identical tool calls with same payload exceeding max threshold.
   * 2. Alternating ping-pong cycles (e.g. A -> B -> A -> B).
   * 3. 3-step cycle patterns (e.g. A -> B -> C -> A -> B -> C).
   */
  public static checkLoopProtection(context: AgentContext, nextToolName: string, nextInputPayload: any): void {
    const memory = context.memory;
    if (!memory) return;

    const maxRepeated = context.constraints?.maxRepeatedToolCalls ?? 3;
    const currentSignature = this.computeToolSignature(nextToolName, nextInputPayload);
    const signatures = [...memory.toolCallSignatures, currentSignature];

    // 1. Check consecutive identical tool calls
    let consecutiveCount = 0;
    for (let i = signatures.length - 1; i >= 0; i--) {
      if (signatures[i] === currentSignature) {
        consecutiveCount++;
      } else {
        break;
      }
    }

    if (consecutiveCount >= maxRepeated) {
      throw new AgentLoopDetectedError(
        context.agentName,
        `Repeated identical call to tool '${nextToolName}' (${consecutiveCount} times in succession with identical arguments).`
      );
    }

    // 2. Check 2-step alternating cycles (A -> B -> A -> B)
    if (signatures.length >= 4) {
      const len = signatures.length;
      const s0 = signatures[len - 1]; // current candidate
      const s1 = signatures[len - 2];
      const s2 = signatures[len - 3];
      const s3 = signatures[len - 4];

      if (s0 === s2 && s1 === s3 && s0 !== s1) {
        throw new AgentLoopDetectedError(
          context.agentName,
          `Alternating cycle detected between tools (${signatures[len - 2].split(':')[0]} <-> ${nextToolName}).`
        );
      }
    }

    // 3. Check 3-step cycles (A -> B -> C -> A -> B -> C)
    if (signatures.length >= 6) {
      const len = signatures.length;
      const s0 = signatures[len - 1];
      const s1 = signatures[len - 2];
      const s2 = signatures[len - 3];
      const s3 = signatures[len - 4];
      const s4 = signatures[len - 5];
      const s5 = signatures[len - 6];

      if (s0 === s3 && s1 === s4 && s2 === s5 && (s0 !== s1 || s1 !== s2)) {
        throw new AgentLoopDetectedError(
          context.agentName,
          `3-step repeating tool loop detected (${nextToolName} -> ${signatures[len - 2].split(':')[0]} -> ${signatures[len - 3].split(':')[0]}).`
        );
      }
    }
  }

  /**
   * Records a completed step into short-term execution memory.
   */
  public static recordStep(
    context: AgentContext,
    record: {
      toolName: string;
      inputPayload: any;
      outputPayload: any;
      status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
      durationMs: number;
      evaluation?: AgentStepEvaluation;
    }
  ): void {
    if (!context.memory) {
      context.memory = {
        stepHistory: [],
        plan: [],
        intermediateFindings: [],
        decisions: [],
        toolCallSignatures: [],
        customState: {}
      };
    }

    const memory = context.memory;
    const cleanInput = this.redactSecrets(record.inputPayload);
    const cleanOutput = this.redactSecrets(record.outputPayload);
    const signature = this.computeToolSignature(record.toolName, record.inputPayload);

    const stepRecord: AgentStepRecord = {
      stepNumber: (context.currentStep ?? 0) + 1,
      toolName: record.toolName,
      inputPayload: cleanInput,
      outputPayload: cleanOutput,
      status: record.status,
      durationMs: record.durationMs,
      timestamp: new Date().toISOString(),
      evaluation: record.evaluation
    };

    memory.stepHistory.push(stepRecord);
    if (memory.stepHistory.length > this.MAX_HISTORY_ITEMS) {
      memory.stepHistory.shift();
    }

    memory.toolCallSignatures.push(signature);
    if (memory.toolCallSignatures.length > this.MAX_HISTORY_ITEMS) {
      memory.toolCallSignatures.shift();
    }

    context.currentStep = stepRecord.stepNumber;
    context.toolCallsCount = (context.toolCallsCount ?? 0) + 1;
  }

  /**
   * Records a plan into memory.
   */
  public static setPlan(context: AgentContext, plan: AgentPlanStep[]): void {
    if (!context.memory) {
      context.memory = {
        stepHistory: [],
        plan: [],
        intermediateFindings: [],
        decisions: [],
        toolCallSignatures: [],
        customState: {}
      };
    }
    context.memory.plan = plan;
  }

  /**
   * Appends an intermediate finding to short-term memory.
   */
  public static addFinding(context: AgentContext, finding: any): void {
    if (!context.memory) return;
    context.memory.intermediateFindings.push(finding);
  }

  /**
   * Records an architectural or strategy decision.
   */
  public static addDecision(context: AgentContext, decision: string): void {
    if (!context.memory) return;
    context.memory.decisions.push(decision);
  }
}
