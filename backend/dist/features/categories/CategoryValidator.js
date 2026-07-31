"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    slug: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    iconUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    seoTitle: zod_1.z.string().optional(),
    seoDescription: zod_1.z.string().optional(),
    displayOrder: zod_1.z.number().int().optional(),
    status: zod_1.z.enum(['active', 'inactive']).optional(),
    showInNavigation: zod_1.z.boolean().optional(),
    isFeatured: zod_1.z.boolean().optional(),
});
exports.updateCategorySchema = exports.createCategorySchema.partial();
