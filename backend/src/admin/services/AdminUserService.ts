import { userRepository, UserEntity } from '@repositories/UserRepository';
import { AppError } from '@/errors/appError';
import { clearAuthRateLimitAccount } from '@middlewares/authRateLimiter';

export class AdminUserService {
  async listUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'inactive' | 'locked' | 'all';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 10));

    const { users, total } = await userRepository.findAll({
      ...params,
      page,
      limit
    });

    return {
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        google_id: u.google_id,
        avatar_url: u.avatar_url,
        is_verified: u.is_verified,
        is_active: u.is_active,
        login_failed_attempts: u.login_failed_attempts,
        login_locked_until: u.login_locked_until,
        is_login_locked: Boolean(u.login_locked_until && u.login_locked_until.getTime() > Date.now()),
        last_login_at: u.last_login_at,
        created_at: u.created_at,
        updated_at: u.updated_at
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async toggleStatus(id: string, isActive: boolean) {
    if (!id) {
      throw new AppError('User ID is required', 400);
    }
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updated = await userRepository.updateStatus(id, isActive);
    return {
      id: updated!.id,
      name: updated!.name,
      email: updated!.email,
      is_active: updated!.is_active,
      updated_at: updated!.updated_at
    };
  }

  async getStats() {
    return await userRepository.getStats();
  }

  async unlockLogin(id: string) {
    if (!id) {
      throw new AppError('User ID is required', 400);
    }

    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updated = await userRepository.unlockLogin(id);
    if (!updated) {
      throw new AppError('User could not be unlocked', 500);
    }

    clearAuthRateLimitAccount('user-login', updated.email);

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      login_failed_attempts: updated.login_failed_attempts,
      login_locked_until: updated.login_locked_until,
      is_login_locked: false,
      updated_at: updated.updated_at
    };
  }
}

export const adminUserService = new AdminUserService();
