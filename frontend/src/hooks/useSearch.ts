import { useQuery } from '@tanstack/react-query';
import { PublicApi } from '@api/publicApi';
import { apiClient } from '@api/client';

export interface SearchFilters {
  type?: string;
  categoryId?: string;
  godId?: string;
  festivalId?: string;
  hasPdf?: boolean;
  hasVideo?: boolean;
}

export const useSearch = (query: string, filters: SearchFilters = {}, sort: string = 'RELEVANCE', page: number = 1) => {
  return useQuery({
    queryKey: ['search', query, filters, sort, page],
    queryFn: async () => {
      const res = await PublicApi.search(query, filters, sort, page);
      const items = res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      const pagination = res?.data?.pagination || {
        total: items.length,
        page,
        limit: 20,
        totalPages: Math.max(1, Math.ceil(items.length / 20))
      };
      return {
        items,
        total: pagination.total ?? items.length,
        pagination
      };
    },
    enabled: Boolean(query && query.trim().length > 0)
  });
};

export const useSearchSuggestions = (query: string, type: string = 'ALL') => {
  return useQuery<any[]>({
    queryKey: ['search-suggestions', query, type],
    queryFn: async () => {
      const res = await apiClient.get('/v1/search/suggestions', {
        params: { q: (query || '').trim(), type }
      });
      return res.data?.data?.suggestions || [];
    },
    enabled: true,
    staleTime: 30000
  });
};

export const useTrendingSearches = () => {
  return useQuery<string[]>({
    queryKey: ['trending-searches'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/v1/search/trending');
        return (
          res.data?.data?.trending || [
            'Hanuman Chalisa',
            'Shiv Tandav',
            'Deepawali',
            'Krishna Janmashtami',
            'Bhagavad Gita'
          ]
        );
      } catch {
        return ['Hanuman Chalisa', 'Shiv Tandav', 'Deepawali', 'Krishna Janmashtami', 'Bhagavad Gita'];
      }
    },
    staleTime: 300000
  });
};
