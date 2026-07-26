"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AIService = void 0;
const Factory_1 = require("./providers/Factory");
const aiValidator_1 = require("./validators/aiValidator");
const zod_1 = require("zod");
const generate_seo_prompt_1 = require("./prompts/generate-seo.prompt");
const SeoOutputSchema = zod_1.z.object({
    seoTitle: zod_1.z.string(),
    seoDescription: zod_1.z.string(),
    keywords: zod_1.z.array(zod_1.z.string()),
    tags: zod_1.z.array(zod_1.z.string()),
});
/**
 * AI Gateway Service
 * Abstracts the underlying provider (Groq, OpenAI, etc.) and exposes strongly typed business methods.
 */
class AIService {
    provider;
    constructor() {
        this.provider = Factory_1.AIProviderFactory.getProvider();
    }
    /**
     * Generates SEO metadata for a Bhajan.
     */
    async generateSEO(title, description, categoryName, godName) {
        const systemPrompt = generate_seo_prompt_1.generateSeoSystemPrompt;
        const userPrompt = (0, generate_seo_prompt_1.buildGenerateSeoUserPrompt)(title, description, categoryName, godName);
        const rawOutput = await this.provider.generate(systemPrompt, userPrompt, { jsonMode: true });
        return await aiValidator_1.AIValidator.validateOrRepair(this.provider, SeoOutputSchema, rawOutput, systemPrompt, userPrompt);
    }
}
exports.AIService = AIService;
exports.aiService = new AIService();
