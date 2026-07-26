import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../responses/apiResponse';
import { supabase } from '../../database/supabase';
import { getPaginationData, formatPaginatedResponse } from '../../utils/pagination';

class AdminBhajanController {
  public list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = getPaginationData(req.query as any);
      const offset = (page - 1) * limit;

      const { data, count, error } = await supabase
        .from('bhajans')
        .select('id, title, slug, status, metadata_status, created_at, views', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return sendSuccess(res, 'Bhajans fetched', formatPaginatedResponse(data, count || 0, page, limit));
    } catch (error) {
      next(error);
    }
  };

  public bulkAction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids, action } = req.body;
      
      // In production, dispatch events or update DB based on action
      // e.g., 'PUBLISH', 'UNPUBLISH', 'REGENERATE_AI', 'REGENERATE_PDF'
      
      return sendSuccess(res, `Successfully triggered ${action} on ${ids.length} items`, {});
    } catch (error) {
      next(error);
    }
  };
}

export const adminBhajanController = new AdminBhajanController();
