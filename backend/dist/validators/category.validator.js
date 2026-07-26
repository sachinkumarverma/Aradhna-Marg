"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Name must be at least 2 characters").max(255),
    slug: zod_1.z.string().min(2, "Slug must be at least 2 characters").max(255).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
    description: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    iconUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    seoTitle: zod_1.z.string().max(255).optional(),
    seoDescription: zod_1.z.string().optional(),
    displayOrder: zod_1.z.number().int().optional(),
    status: zod_1.z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).optional(),
});
exports.updateCategorySchema = exports.createCategorySchema.partial();
