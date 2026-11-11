import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { isRecaptchaConfigured, verifyRecaptchaToken } from '@utils/recaptcha';
import { userRepository } from '@repositories/UserRepository';

type RateLimitMode = 'failed-auth' | 'request';

interface AuthRateLimitOptions {
  scope: string;
  mode: RateLimitMode;
  accountFields?: string[];
  maxAttempts?: number;
  windowMs?: number;
  blockMs?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  captchaAction?: string;
  captchaAfterAttempts?: number;
  captchaVerifier?: (token: string | undefined, action: string, remoteIp?: string) => Promise<boolean>;
  onAccountLocked?: (accountIdentifier: string, blockedUntil: Date) => Promise<void> | void;
  onAccountSuccess?: (accountIdentifier: string) => Promise<void> | void;
}

interface AttemptState {
  count: number;
  resetAt: number;
  blockedUntil?: number;
}

const attempts = new Map<string, AttemptState>();
const accountIpKeys = new Map<string, Set<string>>();
const ipAccountKeys = new Map<string, Set<string>>();

const getClientIp = (req: Request): string => req.ip || 'unknown';

const getAccountIdentifier = (req: Request, fields: string[]): string | undefined => {
  for (const field of fields) {
    const value = req.body?.[field];
    if (typeof value === 'string' && value.trim()) {
      return value.trim().toLowerCase().slice(0, 320);
    }
  }

  return undefined;
};

const getKeys = (req: Request, options: AuthRateLimitOptions): string[] => {
  const keys = [`${options.scope}:ip:${getClientIp(req)}`];
  const accountIdentifier = getAccountIdentifier(req, options.accountFields || []);

  if (accountIdentifier) {
    keys.push(`${options.scope}:account:${accountIdentifier}`);
  }

  return keys;
};

const trackAccountIpKey = (keys: string[]): void => {
  const ipKey = keys.find((key) => key.includes(':ip:'));
  const accountKey = keys.find((key) => key.includes(':account:'));
  if (!ipKey || !accountKey) return;

  const linkedIps = accountIpKeys.get(accountKey) || new Set<string>();
  linkedIps.add(ipKey);
  accountIpKeys.set(accountKey, linkedIps);

  const linkedAccounts = ipAccountKeys.get(ipKey) || new Set<string>();
  linkedAccounts.add(accountKey);
  ipAccountKeys.set(ipKey, linkedAccounts);
};

const pruneExpiredEntries = (now: number): void => {
  if (attempts.size < 10_000) return;

  for (const [key, state] of attempts) {
    if (state.resetAt <= now && (!state.blockedUntil || state.blockedUntil <= now)) {
      attempts.delete(key);
    }
  }
};

const getState = (key: string, now: number, windowMs: number): AttemptState => {
  const existing = attempts.get(key);
  if (!existing || existing.resetAt <= now) {
    const fresh = { count: 0, resetAt: now + windowMs };
    attempts.set(key, fresh);
    return fresh;
  }

  return existing;
};

const getRetryAfterSeconds = (states: AttemptState[], now: number): number => {
  const retryAt = Math.max(...states.map((state) => state.blockedUntil || state.resetAt));
  return Math.max(1, Math.ceil((retryAt - now) / 1000));
};

const sleep = (durationMs: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, durationMs));

const recordAttempt = (
  keys: string[],
  now: number,
  windowMs: number,
  blockMs: number,
  maxAttempts: number
): { blockedUntil: number | undefined; key: string | undefined } => {
  let accountLock: { blockedUntil: number; key: string } | undefined;

  keys.forEach((key) => {
    const state = getState(key, now, windowMs);
    state.count += 1;
    if (state.count >= maxAttempts) {
      state.blockedUntil = now + blockMs;
      if (key.includes(':account:')) {
        accountLock = { blockedUntil: state.blockedUntil, key };
      }
    }
  });

  return accountLock || { blockedUntil: undefined, key: undefined };
};

export const createAuthRateLimiter = (options: AuthRateLimitOptions): RequestHandler => {
  const maxAttempts = options.maxAttempts ?? 5;
  const windowMs = options.windowMs ?? 15 * 60_000;
  const blockMs = options.blockMs ?? 15 * 60_000;
  const baseDelayMs = options.baseDelayMs ?? 100;
  const maxDelayMs = options.maxDelayMs ?? 2_000;
  const captchaAfterAttempts = options.captchaAfterAttempts ?? 3;
  const captchaVerifier = options.captchaVerifier || verifyRecaptchaToken;
  const captchaEnabled =
    Boolean(options.captchaAction) && (Boolean(options.captchaVerifier) || isRecaptchaConfigured());

  return async (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    pruneExpiredEntries(now);
    const keys = getKeys(req, options);
    trackAccountIpKey(keys);
    const states = keys.map((key) => getState(key, now, windowMs));

    if (states.some((state) => state.blockedUntil && state.blockedUntil > now)) {
      const retryAfter = getRetryAfterSeconds(states, now);
      res.setHeader('Retry-After', retryAfter);
      const accountLocked = keys.some(
        (key, index) => key.includes(':account:') && states[index].blockedUntil && states[index].blockedUntil > now
      );
      return res.status(429).json({
        success: false,
        message: accountLocked
          ? 'Your account is temporarily locked because of repeated failed sign-in attempts. Please try again later.'
          : 'Too many authentication attempts. Please try again later.',
        status: accountLocked ? 'ACCOUNT_LOCKED' : 'RATE_LIMITED'
      });
    }

    if (states.some((state) => state.count >= maxAttempts)) {
      states.forEach((state) => {
        state.blockedUntil = now + blockMs;
      });
      res.setHeader('Retry-After', Math.ceil(blockMs / 1000));
      const accountLocked = keys.some((key) => key.includes(':account:'));
      if (accountLocked && options.onAccountLocked) {
        const accountIdentifier = getAccountIdentifier(req, options.accountFields || []);
        if (accountIdentifier) {
          void Promise.resolve(options.onAccountLocked(accountIdentifier, new Date(now + blockMs))).catch(
            () => undefined
          );
        }
      }
      return res.status(429).json({
        success: false,
        message: accountLocked
          ? 'Your account is temporarily locked because of repeated failed sign-in attempts. Please try again later.'
          : 'Too many authentication attempts. Please try again later.',
        status: accountLocked ? 'ACCOUNT_LOCKED' : 'RATE_LIMITED'
      });
    }

    if (captchaEnabled && states.some((state) => state.count >= captchaAfterAttempts)) {
      const captchaToken = typeof req.body?.captchaToken === 'string' ? req.body.captchaToken : undefined;
      const captchaAction = options.captchaAction as string;

      if (!captchaToken) {
        res.setHeader('Retry-After', '1');
        return res.status(428).json({
          success: false,
          message: 'Additional verification is required before continuing.',
          status: 'CAPTCHA_REQUIRED',
          captchaRequired: true,
          captchaAction
        });
      }

      const validCaptcha = await captchaVerifier(captchaToken, captchaAction, getClientIp(req));
      if (!validCaptcha) {
        const attempt = recordAttempt(keys, Date.now(), windowMs, blockMs, maxAttempts);
        if (attempt.key && attempt.blockedUntil && options.onAccountLocked) {
          const accountIdentifier = getAccountIdentifier(req, options.accountFields || []);
          if (accountIdentifier) {
            void Promise.resolve(options.onAccountLocked(accountIdentifier, new Date(attempt.blockedUntil))).catch(
              () => undefined
            );
          }
        }
        return res.status(403).json({
          success: false,
          message: 'Additional verification failed. Please try again.',
          status: 'CAPTCHA_FAILED'
        });
      }
    }

    const highestCount = Math.max(...states.map((state) => state.count));
    const delayMs = Math.min(maxDelayMs, baseDelayMs * 2 ** highestCount);
    if (delayMs > 0 && highestCount > 0) {
      await sleep(delayMs);
    }

    res.once('finish', () => {
      const failed = res.statusCode >= 400 && res.statusCode < 500;
      const shouldCount = options.mode === 'request' || failed;

      if (!shouldCount) {
        const accountIdentifier = getAccountIdentifier(req, options.accountFields || []);
        keys.filter((key) => key.includes(':account:')).forEach((key) => attempts.delete(key));
        if (accountIdentifier && options.onAccountSuccess) {
          void Promise.resolve(options.onAccountSuccess(accountIdentifier)).catch(() => undefined);
        }
        return;
      }

      const finishedAt = Date.now();
      keys.forEach((key) => {
        const state = getState(key, finishedAt, windowMs);
        const wasLocked = Boolean(state.blockedUntil && state.blockedUntil > finishedAt);
        state.count += 1;
        if (state.count >= maxAttempts) {
          state.blockedUntil = finishedAt + blockMs;
          if (!wasLocked && key.includes(':account:') && options.onAccountLocked) {
            const accountIdentifier = getAccountIdentifier(req, options.accountFields || []);
            if (accountIdentifier) {
              void Promise.resolve(options.onAccountLocked(accountIdentifier, new Date(state.blockedUntil))).catch(
                () => undefined
              );
            }
          }
        }
      });
    });

    return next();
  };
};

export const clearAuthRateLimitAccount = (scope: string, accountIdentifier: string): void => {
  const accountKey = `${scope}:account:${accountIdentifier.trim().toLowerCase().slice(0, 320)}`;
  attempts.delete(accountKey);

  const linkedIps = accountIpKeys.get(accountKey) || new Set<string>();
  linkedIps.forEach((ipKey) => {
    const linkedAccounts = ipAccountKeys.get(ipKey);
    linkedAccounts?.delete(accountKey);
    if (!linkedAccounts || linkedAccounts.size === 0) {
      attempts.delete(ipKey);
      ipAccountKeys.delete(ipKey);
    }
  });
  accountIpKeys.delete(accountKey);
};

export const userLoginRateLimiter = createAuthRateLimiter({
  scope: 'user-login',
  mode: 'failed-auth',
  accountFields: ['email'],
  captchaAction: 'user_login',
  onAccountLocked: (email, blockedUntil) => userRepository.lockLoginByEmail(email, blockedUntil),
  onAccountSuccess: (email) => userRepository.clearLoginLockByEmail(email)
});

export const userGoogleRedirectRateLimiter = createAuthRateLimiter({
  scope: 'user-google-redirect',
  mode: 'failed-auth',
  accountFields: []
});

export const userAuthRequestRateLimiter = (scope: string): RequestHandler =>
  createAuthRateLimiter({
    scope: `user-${scope}`,
    mode: 'request',
    accountFields: ['email']
  });

export const adminLoginRateLimiter = createAuthRateLimiter({
  scope: 'admin-login',
  mode: 'failed-auth',
  accountFields: ['username', 'email'],
  captchaAction: 'admin_login'
});

export const adminGoogleRedirectRateLimiter = createAuthRateLimiter({
  scope: 'admin-google-redirect',
  mode: 'failed-auth',
  accountFields: []
});
