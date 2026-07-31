import Groq from 'groq-sdk';
import { IAIProvider, IAIGenerationOptions } from '@/ai/interfaces/AIProvider';
import { config } from '@/config';
import { InternalServerError } from '@/errors/appError';
import { logger } from '@utils/logger';

export class GroqProvider implements IAIProvider {
  private client: Groq;

  constructor() {
    if (!config.GROQ_API_KEY) {
      throw new InternalServerError('GROQ_API_KEY is not defined in environment variables.');
    }
    this.client = new Groq({ apiKey: config.GROQ_API_KEY });
  }

  public async generate(systemPrompt: string, userPrompt: string, options?: IAIGenerationOptions): Promise<string> {
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
    } catch (error: any) {
      logger.error('GroqProvider Generation Error:', error);
      throw new InternalServerError(`Groq generation failed: ${error.message}`);
    }
  }
}
