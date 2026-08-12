export const generateSlug = (text?: string) => {
  return crypto.randomUUID();
};
