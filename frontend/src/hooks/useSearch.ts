import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@api/client';

export interface SearchFilters {
  categoryId?: string;
  godId?: string;
  festivalId?: string;
  hasPdf?: boolean;
  hasVideo?: boolean;
}

export const useSearch = (query: string, filters: SearchFilters, sort: string, page: number = 1) => {
  return useQuery({
    queryKey: ['search', query, filters, sort, page],
    queryFn: async () => {
      const { data } = await apiClient.get('/search', {
        params: { q: query, sort, page, ...filters },
      });
      return data.data; // { data: [...], meta: {...} } from API Response
    },
    enabled: !!query || Object.keys(filters).length > 0,
  });
};

export const useSearchSuggestions = (query: string) => {
  return useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: async () => {
      const { data } = await apiClient.get('/search/suggestions', { params: { q: query } });
      return data.data.suggestions as string[];
    },
    enabled: query.length >= 2,
    staleTime: 60000,
  });
};

export const useTrendingSearches = () => {
  return useQuery({
    queryKey: ['trending-searches'],
    queryFn: async () => {
      const { data } = await apiClient.get('/search/trending');
      return data.data.trending as string[];
    },
    staleTime: 300000,
  });
};
