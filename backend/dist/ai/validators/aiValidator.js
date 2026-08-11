"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIValidator = void 0;
const logger_1 = require("../../utils/logger");
class AIValidator {
    /**
     * Validates AI JSON output against a Zod schema.
     * Features a retry mechanism to prompt the AI to fix its own JSON if it fails validation.
     */
    static async validateOrRepair(provider, schema, rawJsonString, systemPrompt, userPrompt, maxRetries = 2) {
        let currentAttempt = 0;
        let jsonToValidate = rawJsonString;
        while (currentAttempt <= maxRetries) {
            try {
                const parsedObject = JSON.parse(jsonToValidate);
                return schema.parse(parsedObject);
            }
            catch (error) {
                logger_1.logger.warn(`AI JSON Validation failed on attempt ${currentAttempt + 1}`, error.message);
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
exports.AIValidator = AIValidator;
