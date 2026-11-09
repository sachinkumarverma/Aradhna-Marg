import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { config } from '@/config';
import { AppError } from '@/errors/appError';

export interface UserJwtPayload {
  id: string;
  email: string;
  name: string;
  role: 'user';
}

/**
 * Hash password securely with salt using Node's crypto.scrypt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verify plaintext password against stored salt:hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Generate 30-day JWT for authenticated public user
 */
export function generateUserToken(user: { id: string; email: string; name: string }): string {
  const payload: UserJwtPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: 'user'
  };

  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '30d' });
}

/**
 * Verify and decode User JWT
 */
export function verifyUserToken(token: string): UserJwtPayload {
  return jwt.verify(token, config.JWT_SECRET) as UserJwtPayload;
}

/**
 * Verify Google ID Token (Credential) directly with Google OAuth2 TokenInfo API
 * Zero extra C++ native dependencies required.
 */
export async function verifyGoogleToken(idToken: string): Promise<{
  email: string;
  name: string;
  sub: string;
  picture?: string;
  email_verified?: boolean;
}> {
  try {
    const res = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, {
      timeout: 10000
    });

    const data = res.data;
    if (!data || !data.email) {
      throw new AppError('Google token verification failed: No email returned', 401);
    }

    return {
      email: data.email.toLowerCase(),
      name: data.name || data.email.split('@')[0],
      sub: data.sub,
      picture: data.picture,
      email_verified: data.email_verified === 'true' || data.email_verified === true
    };
  } catch (err: any) {
    const msg = err.response?.data?.error_description || err.message || 'Invalid Google ID token';
    throw new AppError(`Google verification failed: ${msg}`, 401);
  }
}
