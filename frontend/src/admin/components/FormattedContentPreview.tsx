import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface FormattedContentPreviewProps {
  content?: string | null;
  className?: string;
  maxHeightClass?: string;
  field?: string;
  isProposed?: boolean;
}

/**
 * Converts lightweight markdown syntax to HTML if the content is not already rich HTML.
 */
function markdownToHtml(md: string): string {
  let html = md;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Unordered lists
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
  if (html.includes('<li>')) {
    html = html.replace(/(<li>[\s\S]*?<\/li>)/gm, '<ul>$1</ul>');
  }

  // Ordered lists
  html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li>$1</li>');

  // Paragraphs
  const paragraphs = html.split(/\n\s*\n/);
  html = paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      if (/^<(h[1-6]|ul|ol|li|blockquote)/i.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
    })
    .join('');

  return html;
}

export const FormattedContentPreview: React.FC<FormattedContentPreviewProps> = ({
  content,
  className = '',
  maxHeightClass = 'max-h-48',
  field,
  isProposed = false
}) => {
  // Process and sanitize content into resolved HTML
  const sanitizedHtml = useMemo(() => {
    if (!content || !content.trim()) return '';

    let formatted = content;

    // Unescape basic HTML entities if content was double-escaped
    if (formatted.includes('&lt;') || formatted.includes('&gt;')) {
      formatted = formatted
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"');
    }

    // Replace non-breaking spaces with standard whitespace for clean text wrapping
    formatted = formatted.replace(/&nbsp;|[\u00A0\u202F\u2007]/g, ' ');

    // If no HTML tags exist, convert markdown / newlines to HTML
    if (!/<[a-z][\s\S]*>/i.test(formatted)) {
      formatted = markdownToHtml(formatted);
    }

    return DOMPurify.sanitize(formatted, {
      ADD_ATTR: ['target', 'rel', 'class', 'style']
    });
  }, [content]);

  if (!content || !content.trim()) {
    return <span className="text-gray-400 italic">None (Empty field)</span>;
  }

  return (
    <div className={`overflow-y-auto leading-relaxed transition-all ${maxHeightClass} ${className}`}>
      <div
        className={`prose prose-xs sm:prose-sm max-w-none break-words ${
          isProposed ? 'text-gray-900' : 'text-gray-700'
        } leading-relaxed font-sans
          [&_*]:!whitespace-normal
          [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-amber-950 [&_h1]:mt-2 [&_h1]:mb-1
          [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-amber-950 [&_h2]:mt-2 [&_h2]:mb-1 [&_h2]:border-b [&_h2]:border-amber-200/50 [&_h2]:pb-0.5
          [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-amber-900 [&_h3]:mt-1.5 [&_h3]:mb-0.5
          [&_h4]:text-xs [&_h4]:font-semibold [&_h4]:text-amber-900 [&_h4]:mt-1 [&_h4]:mb-0.5
          [&_p]:mb-2 [&_p]:last:mb-0 [&_p]:leading-relaxed
          [&_strong]:font-bold [&_strong]:text-amber-950
          [&_b]:font-bold [&_b]:text-amber-950
          [&_em]:italic
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ul]:space-y-0.5
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_ol]:space-y-0.5
          [&_li]:text-inherit
          [&_blockquote]:border-l-3 [&_blockquote]:border-saffron [&_blockquote]:bg-amber-50/50 [&_blockquote]:pl-3 [&_blockquote]:py-1 [&_blockquote]:my-2 [&_blockquote]:italic [&_blockquote]:text-gray-700
          [&_a]:text-saffron [&_a]:underline
          [&_table]:w-full [&_table]:border [&_table]:border-gray-200 [&_table]:my-2
          [&_th]:bg-gray-100 [&_th]:p-1.5 [&_th]:text-left [&_th]:border [&_th]:border-gray-200 [&_th]:text-xs [&_th]:font-bold
          [&_td]:p-1.5 [&_td]:border [&_td]:border-gray-200 [&_td]:text-xs
        `}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  );
};
