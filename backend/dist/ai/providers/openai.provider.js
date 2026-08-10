"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const config_1 = require("@/config");
const appError_1 = require("@/errors/appError");
const logger_1 = require("@utils/logger");
class OpenAIProvider {
    client;
    constructor() {
        if (!config_1.config.OPENAI_API_KEY) {
            throw new appError_1.InternalServerError('OPENAI_API_KEY is not defined in environment variables.');
        }
        this.client = new openai_1.default({ apiKey: config_1.config.OPENAI_API_KEY });
    }
    async generate(systemPrompt, userPrompt, options) {
        try {
            const response = await this.client.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                model: options?.model || 'gpt-4o',
                temperature: options?.temperature || 0.7,
                max_tokens: options?.maxTokens,
                response_format: options?.jsonMode ? { type: 'json_object' } : { type: 'text' }
            });
            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('OpenAI returned empty response');
            }
            return content;
        }
        catch (error) {
            logger_1.logger.error('OpenAIProvider Generation Error:', error);
            throw new appError_1.InternalServerError(`OpenAI generation failed: ${error.message}`);
        }
    }
}
exports.OpenAIProvider = OpenAIProvider;
