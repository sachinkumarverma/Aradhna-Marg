import { config } from '@/config';

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const VERIFY_TIMEOUT_MS = 5_000;

const defaultAllowedHostnames = new Set([
  'aradhnamarg.com',
  'www.aradhnamarg.com',
  'admin.aradhnamarg.com',
  'localhost',
  '127.0.0.1'
]);

export interface RecaptchaVerification {
  success: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  errorCodes?: string[];
}

const getAllowedHostnames = (): Set<string> => {
  const configured = config.RECAPTCHA_ALLOWED_HOSTNAMES?.split(',')
    .map((hostname) => hostname.trim().toLowerCase())
    .filter(Boolean);

  return configured?.length ? new Set(configured) : defaultAllowedHostnames;
};

export const isRecaptchaConfigured = (): boolean => Boolean(config.RECAPTCHA_SECRET_KEY);

export const verifyRecaptchaToken = async (
  token: string | undefined,
  expectedAction: string,
  remoteIp?: string
): Promise<boolean> => {
  if (!config.RECAPTCHA_SECRET_KEY || !token) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

  try {
    const body = new URLSearchParams({
      secret: config.RECAPTCHA_SECRET_KEY,
      response: token
    });

    if (remoteIp) body.set('remoteip', remoteIp);

    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: controller.signal
    });

    if (!response.ok) return false;

    const result = (await response.json()) as RecaptchaVerification;
    const score = result.score ?? 0;
    const hostname = result.hostname?.toLowerCase();

    return Boolean(
      result.success &&
      result.action === expectedAction &&
      score >= config.RECAPTCHA_MIN_SCORE &&
      hostname &&
      getAllowedHostnames().has(hostname)
    );
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
};
