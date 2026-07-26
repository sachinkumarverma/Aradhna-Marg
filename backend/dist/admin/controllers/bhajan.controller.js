"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminBhajanController = void 0;
const apiResponse_1 = require("../../responses/apiResponse");
const supabase_1 = require("../../database/supabase");
const pagination_1 = require("../../utils/pagination");
class AdminBhajanController {
    list = async (req, res, next) => {
        try {
            const { page, limit } = (0, pagination_1.getPaginationData)(req.query);
            const offset = (page - 1) * limit;
            const { data, count, error } = await supabase_1.supabase
                .from('bhajans')
                .select('id, title, slug, status, metadata_status, created_at, views', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            if (error)
                throw error;
            return (0, apiResponse_1.sendSuccess)(res, 'Bhajans fetched', (0, pagination_1.formatPaginatedResponse)(data, count || 0, page, limit));
        }
        catch (error) {
            next(error);
        }
    };
    bulkAction = async (req, res, next) => {
        try {
            const { ids, action } = req.body;
            // In production, dispatch events or update DB based on action
            // e.g., 'PUBLISH', 'UNPUBLISH', 'REGENERATE_AI', 'REGENERATE_PDF'
            return (0, apiResponse_1.sendSuccess)(res, `Successfully triggered ${action} on ${ids.length} items`, {});
        }
        catch (error) {
            next(error);
        }
    };
}
exports.adminBhajanController = new AdminBhajanController();
