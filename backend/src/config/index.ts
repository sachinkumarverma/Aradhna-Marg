import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  AI_PROVIDER: z.enum(['groq', 'openai', 'gemini', 'anthropic']).default('groq'),
  GROQ_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  YOUTUBE_API_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(10),
  ADMIN_USERNAME: z.string().min(3),
  ADMIN_PASSWORD: z.string().min(6),
  CRON_SECRET: z.string().min(10)
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:\n', _env.error.format());
  process.exit(1);
}

export const config = _env.data;
