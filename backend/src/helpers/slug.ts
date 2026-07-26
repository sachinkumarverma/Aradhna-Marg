import { supabase } from '../database/supabase';

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
    let query = supabase.from(tableName).select('id').eq('slug', finalSlug);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.single();

    if (error && error.code === 'PGRST116') {
      // Not found, means it's unique
      isUnique = true;
    } else {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  return finalSlug;
};
