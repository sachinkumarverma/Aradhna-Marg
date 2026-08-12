import { randomUUID } from 'crypto';

export const generateBaseSlug = (text: string): string => {
  return randomUUID();
};

export const generateUniqueSlug = async (baseText: string, tableName: string, excludeId?: string): Promise<string> => {
  return randomUUID();
};
