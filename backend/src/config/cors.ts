import type { CorsOptions } from 'cors';
import { config } from '@/config';

const productionOrigins = ['https://aradhnamarg.com', 'https://www.aradhnamarg.com', 'https://admin.aradhnamarg.com'];

const developmentOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

const normalizeOrigin = (value: string): string | undefined => {
  try {
    return new URL(value.trim()).origin;
  } catch {
    return undefined;
  }
};

export const getAllowedCorsOrigins = (nodeEnv: string, configuredOrigins?: string): Set<string> => {
  const configured = (configuredOrigins || '')
    .split(',')
    .map(normalizeOrigin)
    .filter((origin): origin is string => Boolean(origin));

  const defaults = nodeEnv === 'production' ? productionOrigins : [...productionOrigins, ...developmentOrigins];
  return new Set([...defaults, ...configured]);
};

const allowedOrigins = getAllowedCorsOrigins(config.NODE_ENV, config.CORS_ALLOWED_ORIGINS);

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  }
};
