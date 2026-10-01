import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  AI_PROVIDER: z.enum(['groq', 'openai', 'gemini', 'anthropic']).default('groq'),
  GROQ_API_KEY: z.string().optional(),
  GROQ_DEFAULT_MODEL: z.string().default('openai/gpt-oss-20b'),
  GROQ_LARGE_MODEL: z.string().default('openai/gpt-oss-120b'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  YOUTUBE_API_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(10),
  ADMIN_USERNAME: z.string().min(3),
  ADMIN_PASSWORD: z.string().min(6),
  CRON_SECRET: z.string().min(10),
  SMTP_HOST: z.string().default('smtp-relay.brevo.com'),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  BREVO_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Aradhna Marg <sachinv1410@gmail.com>'),
  EMAIL_FROM_ADDRESS: z.string().default('sachinv1410@gmail.com'),
  ADMIN_EMAIL: z.string().default('sachinv1410@gmail.com')
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:\n', _env.error.format());
  process.exit(1);
}

export const config = _env.data;
