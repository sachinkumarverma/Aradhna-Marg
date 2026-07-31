import { db } from '@common/database/DatabaseClient';

/**
 * Generates a URL-friendly slug from a string.
 */
export const generateBaseSlug = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/[^\w-]+/g, '') // Remove non-word chars
    .replace(/--+/g, '-'); // Replace multiple hyphens with single
};

/**
 * Ensures the slug is unique within a specified table.
 */
export const generateUniqueSlug = async (
  baseText: string,
  tableName: string,
  excludeId?: string
): Promise<string> => {
  const baseSlug = generateBaseSlug(baseText);
  let finalSlug = baseSlug;
  let counter = 2;
  let isUnique = false;

  while (!isUnique) {
    let query = `SELECT id FROM ${tableName} WHERE slug = $1 LIMIT 1`;
    const params: any[] = [finalSlug];
    
    if (excludeId) {
      query = `SELECT id FROM ${tableName} WHERE slug = $1 AND id != $2 LIMIT 1`;
      params.push(excludeId);
    }

    const { rows } = await db.query(query, params);

    if (rows.length === 0) {
      // Not found, means it's unique
      isUnique = true;
    } else {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  return finalSlug;
};
