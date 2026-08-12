import React, { useRef, useEffect, useCallback } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import DOMPurify from 'dompurify';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const ALLOWED_TAGS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'blockquote',
  'ul',
  'ol',
  'li',
  'a',
  'br',
  'hr',
  'span'
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, className }) => {
  const reactQuillRef = useRef<ReactQuill>(null);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // Scrub non-breaking spaces which prevent natural word wrapping
    const plainText = clipboardData.getData('text/plain').replace(/[\u00A0\u202F\u2007]/g, ' ');
    const htmlData = clipboardData.getData('text/html');

    // If plain text contains HTML tags (e.g., user copied HTML source code)
    // we want to parse it as HTML instead of letting Quill escape it into literal text.
    // We check if it looks like HTML by finding a valid supported opening/closing tag.
    const hasHtmlTags = /<\/?(h[1-6]|p|strong|b|em|i|u|s|blockquote|ul|ol|li|a|br|hr|span|div)(>|\s[^>]*>)/i.test(
      plainText
    );

    if (hasHtmlTags) {
      e.preventDefault();

      // Preserve visual gaps (double newlines) from the pasted text by converting them to empty paragraphs
      const htmlWithGaps = plainText.replace(/(?:\r?\n){2,}/g, '\n<p><br></p>\n');

      // Sanitize the pasted HTML to prevent XSS
      const sanitized = DOMPurify.sanitize(htmlWithGaps, {
        ALLOWED_TAGS,
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style']
      });

      const quill = reactQuillRef.current?.getEditor();
      if (quill) {
        const range = quill.getSelection(true);
        // Replace selection or insert at cursor
        quill.clipboard.dangerouslyPasteHTML(range.index, sanitized, 'user');
        // Move cursor to end of pasted content
        setTimeout(() => {
          const delta = quill.clipboard.convert({ html: sanitized });
          quill.setSelection(range.index + delta.length(), 0, 'api');
        }, 0);
      }
    }
  }, []);

  useEffect(() => {
    const quillEditor = reactQuillRef.current?.getEditor();
    if (quillEditor) {
      const editorElement = quillEditor.root;
      editorElement.addEventListener('paste', handlePaste as EventListener, true); // Use capture phase
      return () => {
        editorElement.removeEventListener('paste', handlePaste as EventListener, true);
      };
    }
  }, [handlePaste]);

  return (
    <ReactQuill
      ref={reactQuillRef}
      theme="snow"
      value={value}
      onChange={(content, delta, source, editor) => {
        if (source === 'user') {
          onChange(content);
        }
      }}
      className={className}
      modules={{
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike', 'blockquote'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
          ['clean']
        ],
        clipboard: {
          matchVisual: false
        }
      }}
    />
  );
};
