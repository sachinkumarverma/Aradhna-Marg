import React from 'react';
import DOMPurify from 'dompurify';

interface SafeHtmlContentProps {
  content: string;
  className?: string;
  variant?: 'default' | 'lyrics';
}

export const SafeHtmlContent: React.FC<SafeHtmlContentProps> = ({ content, className = '', variant = 'default' }) => {
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

  // Replace &nbsp; with standard whitespace for clean text wrapping
  formattedContent = formattedContent.replace(/&nbsp;/g, ' ');

  // Strip empty paragraphs <p></p> or <p> </p>
  formattedContent = formattedContent.replace(/<p>\s*<\/p>/gi, '');

  const isLyrics = variant === 'lyrics';

  // Normalize all <h3>, <h4>, <h1>, <h5>, <h6> tags into <h2> headers
  formattedContent = formattedContent.replace(
    /<h[1-6][^>]*>\s*<(strong|b|span)[^>]*>(.*?)<\/(strong|b|span)>\s*<\/h[1-6]>/gi,
    '<h2>$2</h2>'
  );
  formattedContent = formattedContent.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '<h2>$1</h2>');

  // Elevate <p><strong>Heading</strong><br />Text...</p> or <p><strong>Heading</strong></p> into real <h2> section headers!
  formattedContent = formattedContent.replace(
    /<p[^>]*>\s*<(strong|b)>([^<]{2,90})<\/(strong|b)>\s*<br\s*\/?>([\s\S]*?)<\/p>/gi,
    (match, tag1, headingText, tag2, bodyText) => {
      return `<h2>${headingText.trim()}</h2><p>${bodyText.trim()}</p>`;
    }
  );

  formattedContent = formattedContent.replace(
    /<p[^>]*>\s*<(strong|b)>([^<]{2,90})<\/(strong|b)>\s*<\/p>/gi,
    (match, tag1, headingText) => {
      return `<h2>${headingText.trim()}</h2>`;
    }
  );

  if (isLyrics) {
    // For lyrics: ONLY elevate structural titles (e.g. ॥ प्रारंभिक श्लोक ॥, ॥ मुखड़ा ॥, ॥ अंतरा 1 ॥, [Chorus], etc.)
    formattedContent = formattedContent.replace(/<p[^>]*>\s*([^<]{2,80})\s*<\/p>/gi, (match, innerText) => {
      const trimmed = innerText.trim();
      const isLyricsSectionTitle =
        (trimmed.startsWith('॥') && (trimmed.endsWith('॥') || trimmed.length < 35)) ||
        (trimmed.startsWith('||') && (trimmed.endsWith('||') || trimmed.length < 35)) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
        /^(॥|\|\||\(|\b)?(श्लोक|प्रारंभिक श्लोक|मुखड़ा|अंतरा|स्थाई|दोहा|चौपाई|छंद|सोरठा|टेक|Chorus|Verse|Strophe|Intro|Outro|Bridge)/i.test(
          trimmed
        );

      if (isLyricsSectionTitle && trimmed.length < 60) {
        return `<h2>${trimmed}</h2>`;
      }
      return match;
    });
  } else {
    // For articles / generic content: Elevate <p>Heading<br />Text...</p> into real <h2> section headers if Heading ends with ? or :
    formattedContent = formattedContent.replace(
      /<p[^>]*>\s*([^<]{2,80})\s*<br\s*\/?>([\s\S]*?)<\/p>/gi,
      (match, headingText, bodyText) => {
        const trimmed = headingText.trim();
        const isHeading =
          trimmed.length <= 70 &&
          !/[.।;,]$/.test(trimmed) &&
          !trimmed.includes('।') &&
          (trimmed.endsWith('?') || trimmed.endsWith(':'));

        if (isHeading) {
          return `<h2>${trimmed}</h2><p>${bodyText.trim()}</p>`;
        }
        return match;
      }
    );

    // Auto-detect standalone question / colon headers
    formattedContent = formattedContent.replace(/<p[^>]*>\s*([^<]{3,80})\s*<\/p>/gi, (match, innerText) => {
      const trimmed = innerText.trim();
      const isHeading =
        trimmed.length <= 70 &&
        !/[.।;,]$/.test(trimmed) &&
        !trimmed.includes('।') &&
        !trimmed.includes('.') &&
        (trimmed.endsWith('?') || trimmed.endsWith(':'));

      if (isHeading) {
        return `<h2>${trimmed}</h2>`;
      }
      return match;
    });
  }

  // Process text if it doesn't contain HTML paragraph/heading tags
  if (!/<(p|h1|h2|h3|h4|div|ul|ol|blockquote)[^>]*>/i.test(formattedContent)) {
    const lines = formattedContent
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const htmlParts: string[] = [];
    let currentParagraph: string[] = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        let pText = currentParagraph.join(' ');
        pText = pText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        htmlParts.push(`<p>${pText}</p>`);
        currentParagraph = [];
      }
    };

    lines.forEach((line) => {
      const isMarkdownH1 = line.startsWith('# ');
      const isMarkdownH2 = line.startsWith('## ');
      const isMarkdownH3 = line.startsWith('### ');
      const isBoldHeading = line.startsWith('**') && line.endsWith('**') && line.length < 85;

      const isLyricsSectionTitle =
        isLyrics &&
        ((line.startsWith('॥') && (line.endsWith('॥') || line.length < 35)) ||
          (line.startsWith('||') && (line.endsWith('||') || line.length < 35)) ||
          (line.startsWith('[') && line.endsWith(']')) ||
          /^(॥|\|\||\(|\b)?(श्लोक|प्रारंभिक श्लोक|मुखड़ा|अंतरा|स्थाई|दोहा|चौपाई|छंद|सोरठा|टेक|Chorus|Verse|Strophe|Intro|Outro|Bridge)/i.test(
            line
          ));

      const isShortHeading =
        !isLyrics &&
        line.length < 75 &&
        !/[.।;,]$/.test(line) &&
        !line.includes('।') &&
        (line.endsWith('?') || line.endsWith(':'));

      if (isMarkdownH1 || isMarkdownH2 || isMarkdownH3 || isBoldHeading || isLyricsSectionTitle || isShortHeading) {
        flushParagraph();
        const cleanText = line
          .replace(/^#+\s+/, '')
          .replace(/^\*\*/, '')
          .replace(/\*\*$/, '')
          .trim();
        htmlParts.push(`<h2>${cleanText}</h2>`);
      } else {
        currentParagraph.push(line);
      }
    });

    flushParagraph();
    formattedContent = htmlParts.join('');
  }

  // Sanitize the HTML string
  const cleanHtml = DOMPurify.sanitize(formattedContent, {
    ADD_ATTR: ['target', 'rel', 'class']
  });

  return (
    <div
      className={`safe-html-content safe-html-content-${variant} prose prose-slate max-w-none text-slate-800 break-words overflow-hidden font-hindi-body
        prose-headings:font-bold prose-headings:text-darkBrown prose-headings:font-hindi-heading prose-headings:tracking-tight 
        prose-h1:text-2xl md:prose-h1:text-3xl lg:prose-h1:text-4xl prose-h1:mt-8 prose-h1:mb-4
        ${
          isLyrics
            ? 'prose-h2:text-base md:prose-h2:text-lg lg:prose-h2:text-xl prose-h2:mt-4 prose-h2:mb-1.5 prose-h2:text-darkBrown'
            : 'prose-h2:text-xl md:prose-h2:text-2xl lg:prose-h2:text-[26px] prose-h2:mt-8 prose-h2:mb-3.5 prose-h2:text-darkBrown prose-h2:border-b prose-h2:border-orange-100/70 prose-h2:pb-2'
        }
        prose-h3:text-lg md:prose-h3:text-xl lg:prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-2.5 prose-h3:text-darkBrown
        ${
          isLyrics
            ? 'prose-p:text-slate-800 prose-p:text-[15px] sm:prose-p:text-base md:prose-p:text-[17px] prose-p:leading-[1.55] md:prose-p:leading-relaxed prose-p:mb-1 md:prose-p:mb-2 prose-p:mt-0 prose-p:font-hindi-body'
            : 'prose-p:text-slate-800 prose-p:text-[17px] md:prose-p:text-[18px] lg:prose-p:text-[19px] prose-p:leading-[1.8] md:prose-p:leading-[1.85] lg:prose-p:leading-[1.9] prose-p:mb-5 prose-p:mt-0 prose-p:font-hindi-body'
        }
        prose-a:text-saffron prose-a:font-semibold prose-a:no-underline hover:prose-a:underline 
        prose-strong:text-darkBrown prose-strong:font-bold
        prose-ul:my-4 prose-ul:space-y-2 prose-ul:list-disc prose-ul:pl-5 prose-li:marker:text-saffron prose-li:text-slate-800 prose-li:text-[17px] md:prose-li:text-[18px] lg:prose-li:text-[19px] prose-li:leading-relaxed
        prose-ol:my-4 prose-ol:space-y-2 prose-ol:list-decimal prose-ol:pl-5 prose-li:marker:text-saffron prose-li:marker:font-bold
        prose-img:rounded-xl prose-img:shadow-sm prose-img:mx-auto prose-img:my-6 prose-img:w-full prose-img:aspect-video prose-img:object-cover prose-img:border prose-img:border-amber-100
        prose-blockquote:border-l-4 prose-blockquote:border-saffron prose-blockquote:bg-gradient-to-r prose-blockquote:from-amber-50/80 prose-blockquote:to-amber-50/20 prose-blockquote:p-4 prose-blockquote:rounded-r-xl prose-blockquote:italic prose-blockquote:text-slate-800 prose-blockquote:my-5 prose-blockquote:shadow-2xs prose-blockquote:border-y prose-blockquote:border-r prose-blockquote:border-amber-100/50
        ${className}`}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
};
