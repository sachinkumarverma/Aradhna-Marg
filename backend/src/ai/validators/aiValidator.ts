import { z } from 'zod';
import { logger } from '@utils/logger';
import { IAIProvider } from '@/ai/interfaces/AIProvider';

export class AIValidator {
  /**
   * Validates AI JSON output against a Zod schema.
   * Features a retry mechanism to prompt the AI to fix its own JSON if it fails validation.
   */
  public static async validateOrRepair<T>(
    provider: IAIProvider,
    schema: z.ZodSchema<T>,
    rawJsonString: string,
    systemPrompt: string,
    userPrompt: string,
    maxRetries = 2
  ): Promise<T> {
    let currentAttempt = 0;
    let jsonToValidate = rawJsonString;

    while (currentAttempt <= maxRetries) {
      try {
        const parsedObject = JSON.parse(jsonToValidate);
        return schema.parse(parsedObject);
      } catch (error: any) {
        logger.warn(`AI JSON Validation failed on attempt ${currentAttempt + 1}`, error.message);
        
        if (currentAttempt >= maxRetries) {
          throw new Error('AI failed to produce valid JSON after maximum retries.');
        }

        // Ask the AI to repair the JSON by feeding it the validation error
        const repairPrompt = `
          The previous JSON you generated failed validation.
          Error details: ${error.message}
          
          Original faulty JSON:
          ${jsonToValidate}
          
          Please fix the JSON to strictly match the schema without any extra markdown text.
        `;

        jsonToValidate = await provider.generate(systemPrompt, repairPrompt, { jsonMode: true });
        currentAttempt++;
      }
    }

    throw new Error('Unreachable code in AI Validator');
  }
}
