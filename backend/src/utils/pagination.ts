export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export const getPaginationData = (options?: PaginationOptions) => {
  const page = Math.max(1, options?.page || 1);
  const limit = Math.max(1, Math.min(100, options?.limit || 20));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

export const formatPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};
