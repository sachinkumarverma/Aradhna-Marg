import { Request, Response, NextFunction } from 'express';
import { searchService } from '@/search/services/SearchService';
import { sendSuccess } from '@/responses/apiResponse';
import { getPaginationData, formatPaginatedResponse } from '@utils/pagination';

class SearchController {
  public search = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = (req.query.q as string) || '';
      const sort = req.query.sort as any;
      const { page, limit } = getPaginationData(req.query as any);

      const filters = {
        hasPdf: req.query.hasPdf === 'true' ? true : undefined,
        hasVideo: req.query.hasVideo === 'true' ? true : undefined,
        categoryId: req.query.categoryId as string
      };

      const result = await searchService.executeSearch({
        query: q,
        sort,
        filters,
        page,
        limit
      });

      const paginatedData = formatPaginatedResponse(result.data, result.total, page, limit);

      return sendSuccess(res, 'Search completed', paginatedData);
    } catch (error) {
      next(error);
    }
  };

  public getSuggestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = (req.query.q as string) || '';
      const suggestions = await searchService.getSuggestions(q);
      return sendSuccess(res, 'Suggestions fetched', { suggestions });
    } catch (error) {
      next(error);
    }
  };

  public getTrending = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const trending = await searchService.getTrending();
      return sendSuccess(res, 'Trending searches fetched', { trending });
    } catch (error) {
      next(error);
    }
  };
}

export const searchController = new SearchController();
