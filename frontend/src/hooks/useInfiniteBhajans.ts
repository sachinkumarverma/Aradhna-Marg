import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const useInfiniteBhajans = (collectionType: string, filters: any = {}) => {
  return useInfiniteQuery({
    queryKey: ['infinite-bhajans', collectionType, filters],
    queryFn: async ({ pageParam = 1 }) => {
      // Mocked endpoint for architecture phase
      const { data } = await apiClient.get('/search', {
        params: { page: pageParam, limit: 12, collectionType, ...filters }
      });
      return data; // Expected shape: { data: [], meta: { currentPage, totalPages } }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      if (lastPage.meta?.currentPage < lastPage.meta?.totalPages) {
        return lastPage.meta.currentPage + 1;
      }
      return undefined;
    },
  });
};
