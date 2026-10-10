import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { config } from '@/config';
import { logger } from '@/utils/logger';

export interface AiCompletionOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  responseFormatJson?: boolean;
}

export interface AiProvider {
  generateCompletion(options: AiCompletionOptions): Promise<string>;
}

class GroqProvider implements AiProvider {
  private client: Groq;
  private primaryModel: string;
  private fallbackModels: string[];

  constructor() {
    this.client = new Groq({ apiKey: config.GROQ_API_KEY });
    this.primaryModel = config.GROQ_LARGE_MODEL || 'openai/gpt-oss-120b';
    this.fallbackModels = [
      config.GROQ_DEFAULT_MODEL || 'openai/gpt-oss-20b',
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.8-27b'
    ];
  }

  async generateCompletion(options: AiCompletionOptions): Promise<string> {
    const messages: any[] = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: options.prompt });

    const modelsToTry = [this.primaryModel, ...this.fallbackModels.filter((m) => m !== this.primaryModel)];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const params: any = {
          model,
          messages,
          temperature: options.temperature ?? 0.4,
          max_tokens: options.maxTokens ?? 1024
        };

        if (options.responseFormatJson) {
          params.response_format = { type: 'json_object' };
        }

        let res: any;
        try {
          res = await this.client.chat.completions.create(params);
        } catch (err: any) {
          if (
            params.response_format &&
            (err.message?.includes('json_validate_failed') || err.message?.includes('Failed to validate JSON'))
          ) {
            logger.warn({ model }, 'Groq JSON mode validation failed, falling back to prompt-guided JSON');
            delete params.response_format;
            res = await this.client.chat.completions.create(params);
          } else {
            throw err;
          }
        }

        const text = res.choices[0]?.message?.content?.trim() || '';
        if (text) {
          return text;
        }
      } catch (err: any) {
        lastError = err;
        logger.warn({ model, error: err.message }, 'Groq model attempt failed, trying fallback model if available');
      }
    }

    throw new Error(`All Groq models failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }
}

class OpenAiProvider implements AiProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  }

  async generateCompletion(options: AiCompletionOptions): Promise<string> {
    const messages: any[] = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: options.prompt });

    const params: any = {
      model: 'gpt-4o-mini',
      messages,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 1024
    };

    if (options.responseFormatJson) {
      params.response_format = { type: 'json_object' };
    }

    const res = await this.client.chat.completions.create(params);
    return res.choices[0]?.message?.content?.trim() || '';
  }
}

let cachedProvider: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (cachedProvider) return cachedProvider;

  const providerType = config.AI_PROVIDER || 'groq';

  if (providerType === 'openai' && config.OPENAI_API_KEY) {
    cachedProvider = new OpenAiProvider();
    return cachedProvider;
  }

  if (config.GROQ_API_KEY) {
    cachedProvider = new GroqProvider();
    return cachedProvider;
  }

  if (config.OPENAI_API_KEY) {
    cachedProvider = new OpenAiProvider();
    return cachedProvider;
  }

  throw new Error('No AI provider API key found in server configuration (GROQ_API_KEY or OPENAI_API_KEY).');
}
