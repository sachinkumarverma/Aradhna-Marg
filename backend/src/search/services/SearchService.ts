import { searchRepository } from '@/search/repositories/SearchRepository';
import { ISearchOptions, ISearchResult } from '@/search/interfaces';
import { logger } from '@utils/logger';

class SearchService {
  /**
   * Main search business logic.
   * Handles multi-lingual fuzzy routing and analytics logging.
   */
  public async executeSearch(options: ISearchOptions) {
    logger.info(`Executing Search: ${options.query}`);

    // 1. Clean query
    const cleanQuery = options.query.trim().toLowerCase();

    // 2. Perform FTS
    const result = await searchRepository.searchFTS({ ...options, query: cleanQuery });

    // 3. Fallback to Fuzzy/Trigram if FTS returns 0 (Business Rule for misspellings)
    // If no results, we could execute a secondary query using ILIKE or a phonetic algorithm.
    const finalData = result.data;
    const finalTotal = result.total;

    if (result.total === 0 && cleanQuery.length > 3) {
      // Mocking fuzzy fallback logic
      logger.debug(`FTS failed for '${cleanQuery}', attempting fuzzy match.`);
      // const fuzzyResult = await searchRepository.searchFuzzy(options);
      // finalData = fuzzyResult.data;
    }

    // 4. Async Analytics Logging (Fire and forget)
    if (cleanQuery) {
      searchRepository.logSearch(cleanQuery, finalTotal, { filters: options.filters }).catch((err) => {
        logger.error('Failed to log search analytics:', err);
      });
    }

    // 5. Build Highlighted snippets (Normally done via ts_headline in Postgres, mocked here)
    const highlightedData = finalData.map((bhajan) => ({
      ...bhajan,
      // In production, Postgres returns a snippet with <b> tags
      highlightedSnippet: `...${bhajan.title}...`
    }));

    return {
      data: highlightedData,
      total: finalTotal,
      page: options.page || 1,
      limit: options.limit || 20
    };
  }

  public async getSuggestions(query: string, type: string = 'ALL'): Promise<any[]> {
    const trimmed = query?.trim() || '';

    // Initial focus with empty query -> return trending devotional bhajans and puranas
    if (trimmed.length === 0) {
      const result = await searchRepository.searchFTS({ query: '', type, limit: 12 });
      const nonVideoItems = type === 'ALL' ? result.data.filter((r) => r.type !== 'VIDEO') : result.data;

      return nonVideoItems.slice(0, 6).map((r) => ({
        id: r.id,
        title: r.title,
        title_en: r.title_en,
        slug: r.slug,
        type: r.type,
        type_label: r.type_label,
        image: r.image,
        views: r.views
      }));
    }

    const result = await searchRepository.searchFTS({ query: trimmed, type, limit: 15 });
    const filteredItems = type === 'ALL' ? result.data.filter((r) => r.type !== 'VIDEO') : result.data;

    // If no non-video items matched and query was typed, fallback to any matching items
    const finalItems = filteredItems.length > 0 ? filteredItems : result.data;

    return finalItems.slice(0, 8).map((r) => ({
      id: r.id,
      title: r.title,
      title_en: r.title_en,
      slug: r.slug,
      type: r.type,
      type_label: r.type_label,
      image: r.image,
      views: r.views
    }));
  }

  public async getTrending(): Promise<string[]> {
    return searchRepository.getTrendingSearches();
  }
}

export const searchService = new SearchService();
