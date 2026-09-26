import { useQuery } from '@tanstack/react-query';
import { PublicApi } from '@api/publicApi';

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
      const res = await PublicApi.search(query, filters, sort, page);
      return res.data; // Array of search result items
    },
    enabled: true
  });
};

export const useSearchSuggestions = (query: string) => {
  return useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: async () => {
      const res = await PublicApi.search(query, {}, 'RELEVANCE', 1);
      return (res.data || []).map((item: any) => item.title);
    },
    enabled: query.length >= 2,
    staleTime: 60000
  });
};

export const useTrendingSearches = () => {
  return useQuery({
    queryKey: ['trending-searches'],
    queryFn: async () => {
      return ['Hanuman Chalisa', 'Shiv Tandav Stotram', 'Deepawali', 'Krishna Janmashtami', 'Bhagavad Gita'];
    },
    staleTime: 300000
  });
};
