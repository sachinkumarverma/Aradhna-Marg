"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueSlug = exports.generateBaseSlug = void 0;
const DatabaseClient_1 = require("@common/database/DatabaseClient");
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
        let query = `SELECT id FROM ${tableName} WHERE slug = $1 LIMIT 1`;
        const params = [finalSlug];
        if (excludeId) {
            query = `SELECT id FROM ${tableName} WHERE slug = $1 AND id != $2 LIMIT 1`;
            params.push(excludeId);
        }
        const { rows } = await DatabaseClient_1.db.query(query, params);
        if (rows.length === 0) {
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
