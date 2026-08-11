"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchController = void 0;
const SearchService_1 = require("../../search/services/SearchService");
const apiResponse_1 = require("../../responses/apiResponse");
const pagination_1 = require("../../utils/pagination");
class SearchController {
    search = async (req, res, next) => {
        try {
            const q = req.query.q || '';
            const sort = req.query.sort;
            const { page, limit } = (0, pagination_1.getPaginationData)(req.query);
            const filters = {
                hasPdf: req.query.hasPdf === 'true' ? true : undefined,
                hasVideo: req.query.hasVideo === 'true' ? true : undefined,
                categoryId: req.query.categoryId,
            };
            const result = await SearchService_1.searchService.executeSearch({
                query: q,
                sort,
                filters,
                page,
                limit
            });
            const paginatedData = (0, pagination_1.formatPaginatedResponse)(result.data, result.total, page, limit);
            return (0, apiResponse_1.sendSuccess)(res, 'Search completed', paginatedData);
        }
        catch (error) {
            next(error);
        }
    };
    getSuggestions = async (req, res, next) => {
        try {
            const q = req.query.q || '';
            const suggestions = await SearchService_1.searchService.getSuggestions(q);
            return (0, apiResponse_1.sendSuccess)(res, 'Suggestions fetched', { suggestions });
        }
        catch (error) {
            next(error);
        }
    };
    getTrending = async (req, res, next) => {
        try {
            const trending = await SearchService_1.searchService.getTrending();
            return (0, apiResponse_1.sendSuccess)(res, 'Trending searches fetched', { trending });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.searchController = new SearchController();
