"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueSlug = exports.generateBaseSlug = void 0;
const supabase_1 = require("../database/supabase");
/**
 * Generates a URL-friendly slug from a string.
 */
const generateBaseSlug = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/[^\w-]+/g, '') // Remove non-word chars
        .replace(/--+/g, '-'); // Replace multiple hyphens with single
};
exports.generateBaseSlug = generateBaseSlug;
/**
 * Ensures the slug is unique within a specified table.
 */
const generateUniqueSlug = async (baseText, tableName, excludeId) => {
    const baseSlug = (0, exports.generateBaseSlug)(baseText);
    let finalSlug = baseSlug;
    let counter = 2;
    let isUnique = false;
    while (!isUnique) {
        let query = supabase_1.supabase.from(tableName).select('id').eq('slug', finalSlug);
        if (excludeId) {
            query = query.neq('id', excludeId);
        }
        const { data, error } = await query.single();
        if (error && error.code === 'PGRST116') {
            // Not found, means it's unique
            isUnique = true;
        }
        else {
            finalSlug = `${baseSlug}-${counter}`;
            counter++;
        }
    }
    return finalSlug;
};
exports.generateUniqueSlug = generateUniqueSlug;
