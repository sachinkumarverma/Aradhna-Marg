import { db } from '@common/database/DatabaseClient';

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
  google_id: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  last_login_at: Date | null;
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
    verification_token_expires_at?: Date | null;
  }): Promise<UserEntity> {
    const res = await db.query(
      `INSERT INTO users (
        name, email, password_hash, google_id, avatar_url, is_verified, verification_token, verification_token_expires_at
      ) VALUES ($1, LOWER($2), $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        userData.name.trim(),
        userData.email.trim(),
        userData.password_hash || null,
        userData.google_id || null,
        userData.avatar_url || null,
        userData.is_verified ?? false,
        userData.verification_token || null,
        userData.verification_token_expires_at || null
      ]
    );
    return res.rows[0];
  }

  async updateGoogleId(id: string, googleId: string, avatarUrl?: string): Promise<UserEntity> {
    const res = await db.query(
      `UPDATE users 
       SET google_id = $1, 
           avatar_url = COALESCE($2, avatar_url),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [googleId, avatarUrl || null, id]
    );
    return res.rows[0];
  }

  async findByVerificationToken(token: string): Promise<UserEntity | null> {
    const res = await db.query(
      `SELECT * FROM users 
       WHERE verification_token = $1 
         AND (verification_token_expires_at IS NULL OR verification_token_expires_at > NOW()) 
       LIMIT 1`,
      [token]
    );
    return res.rows[0] || null;
  }

  async verifyUser(id: string): Promise<UserEntity> {
    const res = await db.query(
      `UPDATE users 
       SET is_verified = true, 
           verification_token = NULL, 
           verification_token_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return res.rows[0];
  }

  async setVerificationToken(id: string, token: string, expiresAt: Date): Promise<void> {
    await db.query(
      `UPDATE users 
       SET verification_token = $1,
           verification_token_expires_at = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [token, expiresAt, id]
    );
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

  async updateLastLogin(id: string): Promise<void> {
    await db.query(
      `UPDATE users 
       SET last_login_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
  }

  async updateStatus(id: string, isActive: boolean): Promise<UserEntity | null> {
    const res = await db.query(
      `UPDATE users 
       SET is_active = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [isActive, id]
    );
    return res.rows[0] || null;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'inactive' | 'all';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ users: UserEntity[]; total: number }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.search && params.search.trim()) {
      conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx})`);
      values.push(`%${params.search.trim()}%`);
      idx++;
    }

    if (params.status === 'active') {
      conditions.push(`is_active = TRUE`);
    } else if (params.status === 'inactive') {
      conditions.push(`is_active = FALSE`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSortFields: Record<string, string> = {
      name: 'name',
      email: 'email',
      created_at: 'created_at',
      last_login_at: 'last_login_at',
      is_active: 'is_active'
    };
    const sortField = (params.sortBy && allowedSortFields[params.sortBy]) || 'created_at';
    const sortDir = params.sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
    const countRes = await db.query(countQuery, values);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT id, name, email, google_id, avatar_url, is_verified, is_active, last_login_at, created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY ${sortField} ${sortDir}
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    const res = await db.query(query, [...values, limit, offset]);

    return {
      users: res.rows,
      total
    };
  }

  async getStats(): Promise<{ total: number; active: number; inactive: number; googleUsers: number }> {
    const res = await db.query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE is_active = TRUE) AS active,
        COUNT(*) FILTER (WHERE is_active = FALSE) AS inactive,
        COUNT(*) FILTER (WHERE google_id IS NOT NULL) AS google_users
      FROM users
    `);
    const row = res.rows[0] || {};
    return {
      total: parseInt(row.total || '0', 10),
      active: parseInt(row.active || '0', 10),
      inactive: parseInt(row.inactive || '0', 10),
      googleUsers: parseInt(row.google_users || '0', 10)
    };
  }
}

export const userRepository = new UserRepository();
