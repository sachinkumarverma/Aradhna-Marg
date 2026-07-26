"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProviderFactory = void 0;
const groq_provider_1 = require("./groq.provider");
const openai_provider_1 = require("./openai.provider");
const config_1 = require("../../config");
const appError_1 = require("../../errors/appError");
class AIProviderFactory {
    static getProvider() {
        switch (config_1.config.AI_PROVIDER) {
            case 'groq':
                return new groq_provider_1.GroqProvider();
            case 'openai':
                return new openai_provider_1.OpenAIProvider();
            // Future implementations:
            // case 'gemini': return new GeminiProvider();
            // case 'anthropic': return new AnthropicProvider();
            default:
                throw new appError_1.InternalServerError(`AI Provider ${config_1.config.AI_PROVIDER} is not supported.`);
        }
    }
}
exports.AIProviderFactory = AIProviderFactory;
