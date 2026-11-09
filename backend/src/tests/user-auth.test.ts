process.env.NODE_ENV = 'test';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { requireUser } from '../middlewares/userAuth';
import { userRepository } from '../repositories/UserRepository';

describe('User session authorization', () => {
  const originalFindById = userRepository.findById;

  before(() => {
    userRepository.findById = async (id: string) =>
      ({
        id,
        name: 'Devotee',
        email: 'devotee@example.com',
        is_active: true,
        is_verified: true
      }) as any;
  });

  after(() => {
    userRepository.findById = originalFindById;
  });

  const createRequest = (id = 'user-1') => ({
    headers: {
      authorization: `Bearer ${jwt.sign(
        { id, email: 'devotee@example.com', name: 'Devotee', role: 'user' },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      )}`
    }
  });

  it('allows an active user to access protected routes', async () => {
    const request = createRequest();
    let nextError: unknown;
    let nextCalled = false;

    await requireUser(request as any, {} as any, (error) => {
      nextError = error;
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(nextError, undefined);
    assert.equal((request as any).user.id, 'user-1');
  });

  it('rejects a deactivated user even when their JWT is not expired', async () => {
    userRepository.findById = async () => ({ is_active: false }) as any;
    const request = createRequest();
    let nextError: any;

    await requireUser(request as any, {} as any, (error) => {
      nextError = error;
    });

    assert.equal(nextError?.statusCode, 401);
    assert.match(nextError?.message, /deactivated/i);
    assert.equal((request as any).user, undefined);
  });

  it('rejects an unverified user even when their JWT is valid', async () => {
    userRepository.findById = async () => ({ is_active: true, is_verified: false }) as any;
    const request = createRequest();
    let nextError: any;

    await requireUser(request as any, {} as any, (error) => {
      nextError = error;
    });

    assert.equal(nextError?.statusCode, 403);
    assert.match(nextError?.message, /verified/i);
    assert.equal((request as any).user, undefined);
  });
});
