process.env.NODE_ENV = 'test';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { Server } from 'node:http';
import { getAllowedCorsOrigins } from '../config/cors';
import { createAuthRateLimiter } from '../middlewares/authRateLimiter';

describe('Authentication security controls', () => {
  it('allows only configured production origins and includes localhost in development', () => {
    const production = getAllowedCorsOrigins('production');
    const development = getAllowedCorsOrigins('development');

    assert.equal(production.has('https://aradhnamarg.com'), true);
    assert.equal(production.has('https://admin.aradhnamarg.com'), true);
    assert.equal(production.has('http://localhost:5173'), false);
    assert.equal(development.has('http://localhost:5173'), true);
    assert.equal(production.has('https://attacker.example'), false);
  });

  it('blocks repeated request attempts by both IP and account key', async () => {
    const app = express();
    app.use(express.json());
    app.post(
      '/',
      createAuthRateLimiter({
        scope: 'test-request-limit',
        mode: 'request',
        accountFields: ['email'],
        maxAttempts: 2,
        windowMs: 60_000,
        blockMs: 60_000,
        baseDelayMs: 0
      }),
      (_req, res) => res.status(200).json({ ok: true })
    );

    const server = await listen(app);
    try {
      const first = await post(server, 'person@example.com');
      const second = await post(server, 'person@example.com');
      const blocked = await post(server, 'person@example.com');

      assert.equal(first.status, 200);
      assert.equal(second.status, 200);
      assert.equal(blocked.status, 429);
      assert.equal(blocked.headers.get('retry-after'), '60');
    } finally {
      await close(server);
    }
  });

  it('requires and validates CAPTCHA after repeated failed authentication attempts', async () => {
    const app = express();
    app.use(express.json());
    app.post(
      '/',
      createAuthRateLimiter({
        scope: 'test-captcha-limit',
        mode: 'failed-auth',
        accountFields: ['email'],
        maxAttempts: 5,
        captchaAfterAttempts: 2,
        captchaAction: 'test-login',
        captchaVerifier: async (token, action) => token === 'valid-token' && action === 'test-login',
        windowMs: 60_000,
        blockMs: 60_000,
        baseDelayMs: 0
      }),
      (_req, res) => res.status(401).json({ success: false })
    );

    const server = await listen(app);
    try {
      const first = await post(server, 'captcha@example.com');
      const second = await post(server, 'captcha@example.com');
      const challenge = await post(server, 'captcha@example.com');
      const invalid = await post(server, 'captcha@example.com', { captchaToken: 'invalid-token' });
      const valid = await post(server, 'captcha@example.com', { captchaToken: 'valid-token' });

      assert.equal(first.status, 401);
      assert.equal(second.status, 401);
      assert.equal(challenge.status, 428);
      assert.equal((await challenge.json()).status, 'CAPTCHA_REQUIRED');
      assert.equal(invalid.status, 403);
      assert.equal((await invalid.json()).status, 'CAPTCHA_FAILED');
      assert.equal(valid.status, 401);
    } finally {
      await close(server);
    }
  });
});

const listen = (app: express.Express): Promise<Server> =>
  new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });

const post = async (server: Server, email: string, data: Record<string, unknown> = {}): Promise<Response> => {
  const address = server.address() as { port: number };
  return fetch(`http://127.0.0.1:${address.port}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, ...data })
  });
};

const close = (server: Server): Promise<void> =>
  new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
