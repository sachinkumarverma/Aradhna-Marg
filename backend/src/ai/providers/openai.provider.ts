import OpenAI from 'openai';
import { IAIProvider, IAIGenerationOptions } from '@/ai/interfaces/AIProvider';
import { config } from '@/config';
import { InternalServerError } from '@/errors/appError';
import { logger } from '@utils/logger';

export class OpenAIProvider implements IAIProvider {
  private client: OpenAI;

  constructor() {
    if (!config.OPENAI_API_KEY) {
      throw new InternalServerError('OPENAI_API_KEY is not defined in environment variables.');
    }
    this.client = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  }

  public async generate(systemPrompt: string, userPrompt: string, options?: IAIGenerationOptions): Promise<string> {
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
    } catch (error: any) {
      logger.error('OpenAIProvider Generation Error:', error);
      throw new InternalServerError(`OpenAI generation failed: ${error.message}`);
    }
  }
}
