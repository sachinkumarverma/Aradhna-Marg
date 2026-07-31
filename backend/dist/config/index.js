"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('5000'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    SUPABASE_URL: zod_1.z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string().min(1),
    SUPABASE_ANON_KEY: zod_1.z.string().min(1),
    SUPABASE_STORAGE_BUCKET: zod_1.z.string().default('bhajan-assets'),
    DATABASE_URL: zod_1.z.string().url(),
    AI_PROVIDER: zod_1.z.enum(['groq', 'openai', 'gemini', 'anthropic']).default('groq'),
    GROQ_API_KEY: zod_1.z.string().optional(),
    OPENAI_API_KEY: zod_1.z.string().optional(),
    GEMINI_API_KEY: zod_1.z.string().optional(),
    YOUTUBE_API_KEY: zod_1.z.string().optional(),
    JWT_SECRET: zod_1.z.string().min(10),
    ADMIN_USERNAME: zod_1.z.string().min(3),
    ADMIN_PASSWORD: zod_1.z.string().min(6),
    CRON_SECRET: zod_1.z.string().min(10),
});
const _env = envSchema.safeParse(process.env);
if (!_env.success) {
    console.error('❌ Invalid environment variables:\n', _env.error.format());
    process.exit(1);
}
exports.config = _env.data;
