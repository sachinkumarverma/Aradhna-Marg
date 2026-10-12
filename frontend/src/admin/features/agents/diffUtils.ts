/**
 * Word and Character diff utilities for Sanatan devotional content & articles.
 * Safely handles Devanagari Unicode text and English text.
 */

export interface DiffPart {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

/**
 * Decodes HTML entities (e.g. &nbsp; &amp; &lt;) into their actual characters.
 * Uses a temporary textarea element which safely parses entity sequences.
 */
function decodeHtmlEntities(text: string): string {
  if (!text) return text;
  // Replace &nbsp; and common non-breaking spaces with a regular space first
  const withSpaces = text.replace(/&nbsp;/gi, ' ').replace(/\u00a0/g, ' ');
  // Use a textarea to decode remaining HTML entities safely
  try {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = withSpaces;
    return textarea.value;
  } catch {
    // Fallback: manual decode of the most common entities
    return withSpaces
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");
  }
}

/**
 * Tokenizes text into words and spaces/punctuation while preserving exact whitespace.
 */
function tokenize(text: string): string[] {
  if (!text) return [];
  // Tokenize words, whitespace sequences, and punctuation separately
  return text.match(/[\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}\s]+|\s+/gu) || [];
}

/**
 * Standard Longest Common Subsequence (LCS) diff algorithm.
 */
export function computeWordDiff(oldText: string, newText: string): DiffPart[] {
  // Strip HTML tags, then decode HTML entities so &nbsp; etc. render as real characters
  const cleanOld = decodeHtmlEntities(oldText.replace(/<[^>]*>/g, ' '));
  const cleanNew = decodeHtmlEntities(newText.replace(/<[^>]*>/g, ' '));

  const oldTokens = tokenize(cleanOld);
  const newTokens = tokenize(cleanNew);

  const n = oldTokens.length;
  const m = newTokens.length;

  // Optimize for identical texts
  if (cleanOld === cleanNew) {
    return [{ type: 'unchanged', value: cleanOld }];
  }

  // Optimize for completely empty cases
  if (n === 0 && m === 0) return [];
  if (n === 0) return [{ type: 'added', value: cleanNew }];
  if (m === 0) return [{ type: 'removed', value: cleanOld }];

  // LCS Table
  // To keep memory optimal for large articles, limit matrix dimension if text is extremely long
  if (n * m > 250000) {
    // Fallback for massive texts: chunked or simple diff
    return [
      { type: 'removed', value: cleanOld },
      { type: 'added', value: cleanNew }
    ];
  }

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (oldTokens[i] === newTokens[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack to extract diff parts
  const result: DiffPart[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldTokens[i - 1] === newTokens[j - 1]) {
      result.unshift({ type: 'unchanged', value: oldTokens[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', value: newTokens[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({ type: 'removed', value: oldTokens[i - 1] });
      i--;
    }
  }

  // Consolidate adjacent tokens of the same type for cleaner rendering
  const consolidated: DiffPart[] = [];
  for (const part of result) {
    if (consolidated.length > 0 && consolidated[consolidated.length - 1].type === part.type) {
      consolidated[consolidated.length - 1].value += part.value;
    } else {
      consolidated.push({ ...part });
    }
  }

  return consolidated;
}
