/**
 * Markdown & HTML Stripping Utilities for SEO Metadata
 * Ensures all SEO titles, descriptions, and summaries are pure plain text
 * without raw Markdown markers (**, *, ##, _, ``, [link](url)), HTML tags,
 * or malformed whitespace.
 */

/**
 * Strips both HTML tags and common Markdown formatting markers from a text string.
 */
export function stripMarkdownAndHtml(input?: string | null): string {
  if (!input) return '';

  let text = String(input);

  // 1. Strip HTML tags
  text = text.replace(/<[^>]*>/g, ' ');

  // 2. Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

  // 3. Remove Markdown image tags ![alt](url) -> empty
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');

  // 4. Remove Markdown links [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  // 5. Remove Markdown code blocks ```code``` -> empty
  text = text.replace(/```[\s\S]*?```/g, ' ');

  // 6. Remove inline code `code` -> code
  text = text.replace(/`([^`]+)`/g, '$1');

  // 7. Remove headers (# Header)
  text = text.replace(/^[\s]*#{1,6}\s+/gm, ' ');

  // 8. Remove bold/italic markers
  text = text
    .replace(/\*{3}([^*]+)\*{3}/g, '$1')
    .replace(/\*{2}([^*]+)\*{2}/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_{3}([^_]+)_{3}/g, '$1')
    .replace(/_{2}([^_]+)_{2}/g, '$1')
    .replace(/_([^_]+)_/g, '$1');

  // 9. Remove strikethrough ~~text~~ -> text
  text = text.replace(/~~([^~]+)~~/g, '$1');

  // 10. Remove blockquotes (^> )
  text = text.replace(/^[\s]*>\s*/gm, ' ');

  // 11. Remove list markers (- item, * item, + item, 1. item)
  text = text.replace(/^[\s]*[-*+]\s+/gm, ' ');
  text = text.replace(/^[\s]*\d+\.\s+/gm, ' ');

  // 12. Remove horizontal rules (---, ***, ___)
  text = text.replace(/^[-*_]{3,}\s*$/gm, ' ');

  // 13. Replace internal newlines with space
  text = text.replace(/[\r\n\t]+/g, ' ');

  // 14. Collapse multiple spaces
  text = text.replace(/\s{2,}/g, ' ').trim();

  return text;
}

/**
 * Formats a clean, readable SEO description without raw Markdown or HTML tags.
 * Preserves complete, natural sentences and does NOT abruptly break sentences
 * in the middle. Only truncates if content is exceptionally long (e.g. raw article bodies > 260 chars).
 */
export function formatSeoDescription(input?: string | null, maxLength = 260): string {
  const clean = stripMarkdownAndHtml(input);
  if (!clean) return '';

  // If already within reasonable snippet range, preserve the complete sentence as-is!
  if (clean.length <= maxLength) {
    return clean;
  }

  // Look for a sentence boundary (। or .) before maxLength (at least 120 chars)
  const sliced = clean.slice(0, maxLength);
  const lastPurnaViram = sliced.lastIndexOf('।');
  const lastPeriod = sliced.lastIndexOf('.');
  const bestSentenceEnd = Math.max(lastPurnaViram, lastPeriod);

  if (bestSentenceEnd > 120) {
    return clean.slice(0, bestSentenceEnd + 1).trim();
  }

  // If no clean sentence boundary exists, cut gracefully at the last space before maxLength
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace > 120) {
    const trimmed = sliced.slice(0, lastSpace).trim();
    if (!/[.!?।॥]$/.test(trimmed)) {
      return `${trimmed}...`;
    }
    return trimmed;
  }

  return `${sliced.trim()}...`;
}
