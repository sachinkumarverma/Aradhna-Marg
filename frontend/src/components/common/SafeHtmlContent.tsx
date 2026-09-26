import React from 'react';
import DOMPurify from 'dompurify';

interface SafeHtmlContentProps {
  content: string;
  className?: string;
}

export const SafeHtmlContent: React.FC<SafeHtmlContentProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Unescape HTML entities if present (e.g., &lt;p&gt;)
  let formattedContent = content;
  if (formattedContent.includes('&lt;') || formattedContent.includes('&gt;')) {
    formattedContent = formattedContent
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"');
  }

  // Process text if it doesn't contain HTML tags (convert line breaks to paragraph breaks)
  if (!/<[a-z][\s\S]*>/i.test(formattedContent)) {
    formattedContent = formattedContent
      .split('\n\n')
      .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br />')}</p>`)
      .join('');
  }

  // Sanitize the HTML string
  const cleanHtml = DOMPurify.sanitize(formattedContent, {
    ADD_ATTR: ['target', 'rel']
  });

  return (
    <div
      className={`prose prose-slate max-w-none text-slate-800 break-words overflow-hidden
        prose-headings:font-bold prose-headings:text-darkBrown prose-headings:tracking-tight 
        prose-h1:text-2xl md:prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4
        prose-h2:text-xl md:prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
        prose-h3:text-lg md:prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
        prose-p:text-slate-700 prose-p:text-base md:prose-p:text-lg prose-p:leading-relaxed prose-p:mb-6 prose-p:mt-0
        prose-a:text-saffron prose-a:no-underline hover:prose-a:underline 
        prose-strong:text-darkBrown prose-strong:font-bold 
        prose-img:rounded-xl prose-img:shadow-md prose-img:mx-auto prose-img:my-6 prose-img:w-full prose-img:aspect-video prose-img:object-cover
        prose-blockquote:border-l-4 prose-blockquote:border-saffron prose-blockquote:bg-amber-50/50 prose-blockquote:p-4 prose-blockquote:rounded-r-xl prose-blockquote:italic
        ${className}`}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
};
