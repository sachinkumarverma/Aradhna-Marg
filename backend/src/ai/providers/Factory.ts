import { IAIProvider } from '@/ai/interfaces/AIProvider';
import { GroqProvider } from './groq.provider';
import { OpenAIProvider } from './openai.provider';
import { config } from '@/config';
import { InternalServerError } from '@/errors/appError';

export class AIProviderFactory {
  public static getProvider(): IAIProvider {
    switch (config.AI_PROVIDER) {
      case 'groq':
        return new GroqProvider();
      case 'openai':
        return new OpenAIProvider();
      // Future implementations:
      // case 'gemini': return new GeminiProvider();
      // case 'anthropic': return new AnthropicProvider();
      default:
        throw new InternalServerError(`AI Provider ${config.AI_PROVIDER} is not supported.`);
    }
  }
}
