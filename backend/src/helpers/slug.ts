import { generateContentSlug } from '@/utils/slugify';
import { db } from '@common/database/DatabaseClient';

export const generateBaseSlug = (text: string): string => {
  return generateContentSlug(null, text);
};

export const generateUniqueSlug = async (baseText: string, tableName: string, excludeId?: string): Promise<string> => {
  const baseSlug = generateContentSlug(null, baseText);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = excludeId
      ? `SELECT id FROM ${tableName} WHERE slug = $1 AND id != $2 LIMIT 1`
      : `SELECT id FROM ${tableName} WHERE slug = $1 LIMIT 1`;
    const params = excludeId ? [slug, excludeId] : [slug];
    const { rows } = await db.query(query, params);

    if (rows.length === 0) {
      return slug;
    }
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
};
