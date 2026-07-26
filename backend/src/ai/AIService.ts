import { AIProviderFactory } from './providers/Factory';
import { IAIProvider } from './interfaces/AIProvider';
import { AIValidator } from './validators/aiValidator';
import { z } from 'zod';
import { generateSeoSystemPrompt, buildGenerateSeoUserPrompt } from './prompts/generate-seo.prompt';

const SeoOutputSchema = z.object({
  seoTitle: z.string(),
  seoDescription: z.string(),
  keywords: z.array(z.string()),
  tags: z.array(z.string()),
});

type SeoOutput = z.infer<typeof SeoOutputSchema>;

/**
 * AI Gateway Service
 * Abstracts the underlying provider (Groq, OpenAI, etc.) and exposes strongly typed business methods.
 */
export class AIService {
  private provider: IAIProvider;

  constructor() {
    this.provider = AIProviderFactory.getProvider();
  }

  /**
   * Generates SEO metadata for a Bhajan.
   */
  public async generateSEO(title: string, description: string, categoryName?: string, godName?: string): Promise<SeoOutput> {
    const systemPrompt = generateSeoSystemPrompt;
    const userPrompt = buildGenerateSeoUserPrompt(title, description, categoryName, godName);

    const rawOutput = await this.provider.generate(systemPrompt, userPrompt, { jsonMode: true });

    return await AIValidator.validateOrRepair(
      this.provider,
      SeoOutputSchema,
      rawOutput,
      systemPrompt,
      userPrompt
    );
  }

  // Future Methods:
  // public async categorizeBhajan(title: string, lyrics: string) { ... }
  // public async extractCleanLyrics(description: string, rawLyrics: string) { ... }
}

export const aiService = new AIService();
