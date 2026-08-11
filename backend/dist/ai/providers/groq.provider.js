"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroqProvider = void 0;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const config_1 = require("../../config");
const appError_1 = require("../../errors/appError");
const logger_1 = require("../../utils/logger");
class GroqProvider {
    client;
    constructor() {
        if (!config_1.config.GROQ_API_KEY) {
            throw new appError_1.InternalServerError('GROQ_API_KEY is not defined in environment variables.');
        }
        this.client = new groq_sdk_1.default({ apiKey: config_1.config.GROQ_API_KEY });
    }
    async generate(systemPrompt, userPrompt, options) {
        try {
            const response = await this.client.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                model: options?.model || 'llama-3.3-70b-versatile',
                temperature: options?.temperature || 0.7,
                max_tokens: options?.maxTokens,
                response_format: options?.jsonMode ? { type: 'json_object' } : { type: 'text' }
            });
            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('Groq returned empty response');
            }
            return content;
        }
        catch (error) {
            logger_1.logger.error('GroqProvider Generation Error:', error);
            throw new appError_1.InternalServerError(`Groq generation failed: ${error.message}`);
        }
    }
}
exports.GroqProvider = GroqProvider;
