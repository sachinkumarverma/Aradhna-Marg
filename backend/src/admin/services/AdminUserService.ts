import { userRepository, UserEntity } from '@repositories/UserRepository';
import { AppError } from '@/errors/appError';

export class AdminUserService {
  async listUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'inactive' | 'all';
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
}

export const adminUserService = new AdminUserService();
