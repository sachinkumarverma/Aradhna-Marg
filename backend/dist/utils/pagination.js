"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPaginatedResponse = exports.getPaginationData = void 0;
const getPaginationData = (options) => {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.max(1, Math.min(100, options?.limit || 20));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};
exports.getPaginationData = getPaginationData;
const formatPaginatedResponse = (data, total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    return {
        data,
        meta: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    };
};
exports.formatPaginatedResponse = formatPaginatedResponse;
