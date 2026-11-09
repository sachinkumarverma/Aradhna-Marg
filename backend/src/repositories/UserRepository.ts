import { db } from '@common/database/DatabaseClient';

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
  google_id: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  verification_token: string | null;
  verification_token_expires_at: Date | null;
  reset_password_token: string | null;
  reset_password_expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export class UserRepository {
  async findByEmail(email: string): Promise<UserEntity | null> {
    const res = await db.query(`SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`, [email.trim()]);
    return res.rows[0] || null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const res = await db.query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [id]);
    return res.rows[0] || null;
  }

  async findByGoogleId(googleId: string): Promise<UserEntity | null> {
    const res = await db.query(`SELECT * FROM users WHERE google_id = $1 LIMIT 1`, [googleId]);
    return res.rows[0] || null;
  }

  async create(userData: {
    name: string;
    email: string;
    password_hash?: string | null;
    google_id?: string | null;
    avatar_url?: string | null;
    is_verified?: boolean;
    verification_token?: string | null;
  }): Promise<UserEntity> {
    const res = await db.query(
      `INSERT INTO users (
        name, email, password_hash, google_id, avatar_url, is_verified, verification_token
      ) VALUES ($1, LOWER($2), $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        userData.name.trim(),
        userData.email.trim(),
        userData.password_hash || null,
        userData.google_id || null,
        userData.avatar_url || null,
        userData.is_verified ?? false,
        userData.verification_token || null
      ]
    );
    return res.rows[0];
  }

  async updateGoogleId(id: string, googleId: string, avatarUrl?: string): Promise<UserEntity> {
    const res = await db.query(
      `UPDATE users 
       SET google_id = $1, 
           avatar_url = COALESCE($2, avatar_url),
           is_verified = true,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [googleId, avatarUrl || null, id]
    );
    return res.rows[0];
  }

  async setResetPasswordToken(id: string, token: string, expiresAt: Date): Promise<void> {
    await db.query(
      `UPDATE users 
       SET reset_password_token = $1,
           reset_password_expires_at = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [token, expiresAt, id]
    );
  }

  async findByResetToken(token: string): Promise<UserEntity | null> {
    const res = await db.query(
      `SELECT * FROM users 
       WHERE reset_password_token = $1 
         AND reset_password_expires_at > NOW() 
       LIMIT 1`,
      [token]
    );
    return res.rows[0] || null;
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await db.query(
      `UPDATE users 
       SET password_hash = $1,
           reset_password_token = NULL,
           reset_password_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, id]
    );
  }
}

export const userRepository = new UserRepository();
