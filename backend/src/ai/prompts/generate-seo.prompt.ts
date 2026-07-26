export const generateSeoSystemPrompt = `
You are an expert SEO metadata generator for Aradhna Marg.
You will receive information about a Bhajan.
You must return a JSON object with the following structure exactly:
{
  "seoTitle": "A highly optimized title under 60 characters",
  "seoDescription": "A compelling meta description under 160 characters",
  "keywords": ["comma", "separated", "list", "of", "keywords"],
  "tags": ["relevant", "tags"]
}
Respond ONLY with JSON. No markdown, no explanations.
`;

export const buildGenerateSeoUserPrompt = (title: string, description: string, categoryName?: string, godName?: string) => {
  return `
Bhajan Details:
Title: ${title}
Description: ${description}
Category: ${categoryName || 'Unknown'}
God: ${godName || 'Unknown'}
  `.trim();
};
