import React, { useEffect, useRef, useImperativeHandle } from 'react';

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
}

export const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ minRows = 2, className = '', onChange, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }
      },
      [ref]
    );

    const adjustHeight = () => {
      const textarea = internalRef.current;
      if (textarea) {
        textarea.style.height = 'auto'; // Reset height
        textarea.style.height = `${textarea.scrollHeight}px`; // Set to scroll height
      }
    };

    useEffect(() => {
      adjustHeight();
      window.addEventListener('resize', adjustHeight);

      const textarea = internalRef.current;
      let observer: ResizeObserver | null = null;
      if (textarea && typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(() => {
          if (textarea.offsetParent !== null) { // only adjust if visible
            adjustHeight();
          }
        });
        observer.observe(textarea);
      }

      return () => {
        window.removeEventListener('resize', adjustHeight);
        if (observer) observer.disconnect();
      };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <textarea
        ref={setRefs}
        rows={minRows}
        onChange={handleChange}
        className={`${className} resize-y overflow-y-hidden`}
        style={{ minHeight: `${minRows * 1.5}rem` }}
        {...props}
      />
    );
  }
);

AutoResizeTextarea.displayName = 'AutoResizeTextarea';
