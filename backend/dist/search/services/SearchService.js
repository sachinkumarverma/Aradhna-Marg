"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchService = void 0;
const SearchRepository_1 = require("@/search/repositories/SearchRepository");
const logger_1 = require("@utils/logger");
class SearchService {
    /**
     * Main search business logic.
     * Handles multi-lingual fuzzy routing and analytics logging.
     */
    async executeSearch(options) {
        logger_1.logger.info(`Executing Search: ${options.query}`);
        // 1. Clean query
        const cleanQuery = options.query.trim().toLowerCase();
        // 2. Perform FTS
        const result = await SearchRepository_1.searchRepository.searchFTS({ ...options, query: cleanQuery });
        // 3. Fallback to Fuzzy/Trigram if FTS returns 0 (Business Rule for misspellings)
        // If no results, we could execute a secondary query using ILIKE or a phonetic algorithm.
        let finalData = result.data;
        let finalTotal = result.total;
        if (result.total === 0 && cleanQuery.length > 3) {
            // Mocking fuzzy fallback logic
            logger_1.logger.debug(`FTS failed for '${cleanQuery}', attempting fuzzy match.`);
            // const fuzzyResult = await searchRepository.searchFuzzy(options);
            // finalData = fuzzyResult.data;
        }
        // 4. Async Analytics Logging (Fire and forget)
        if (cleanQuery) {
            SearchRepository_1.searchRepository.logSearch(cleanQuery, finalTotal, { filters: options.filters }).catch(err => {
                logger_1.logger.error('Failed to log search analytics:', err);
            });
        }
        // 5. Build Highlighted snippets (Normally done via ts_headline in Postgres, mocked here)
        const highlightedData = finalData.map(bhajan => ({
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
    async getSuggestions(query) {
        if (!query || query.length < 2)
            return [];
        // In production, hit a fast indexed table (e.g., search_logs grouped) or a dedicated suggestions index.
        const result = await SearchRepository_1.searchRepository.searchFTS({ query, limit: 5 });
        return result.data.map(r => r.title);
    }
    async getTrending() {
        return SearchRepository_1.searchRepository.getTrendingSearches();
    }
}
exports.searchService = new SearchService();
