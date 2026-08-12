import { randomUUID } from 'crypto';

export const slugify = (text: string): string => {
  return randomUUID();
};
