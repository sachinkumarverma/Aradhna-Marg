import { useState, useEffect, useRef } from 'react';

/**
 * Dynamically adapts placeholder text to the measured pixel width of an input element.
 * Shows the full text when space permits; dynamically truncates at word boundaries with '…'
 * as available width decreases.
 */
export function useAdaptivePlaceholder(inputRef: React.RefObject<HTMLInputElement | null>, fullText: string): string {
  const [adaptiveText, setAdaptiveText] = useState(fullText);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const calculateFit = () => {
      if (!input || !fullText) return;

      const style = window.getComputedStyle(input);
      const paddingLeft = parseFloat(style.paddingLeft) || 0;
      const paddingRight = parseFloat(style.paddingRight) || 0;
      const availableWidth = input.clientWidth - paddingLeft - paddingRight - 8;

      if (availableWidth <= 0) return;

      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      const fontWeight = style.fontWeight || '400';
      const fontSize = style.fontSize || '16px';
      const fontFamily = style.fontFamily || 'sans-serif';
      ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;

      // 1. If full text fits, display full text
      if (ctx.measureText(fullText).width <= availableWidth) {
        setAdaptiveText(fullText);
        return;
      }

      // 2. Otherwise, dynamically truncate at word boundaries ending with '…'
      const cleanText = fullText.replace(/[.…]+$/, '').trim();
      const words = cleanText.split(/\s+/);

      let bestFit = (words[0] || 'Search').replace(/[,、;]+$/, '') + '…';

      for (let i = words.length - 1; i >= 1; i--) {
        const candidate =
          words
            .slice(0, i)
            .join(' ')
            .replace(/[,、;]+$/, '') + '…';
        if (ctx.measureText(candidate).width <= availableWidth) {
          bestFit = candidate;
          break;
        }
      }

      setAdaptiveText(bestFit);
    };

    calculateFit();

    const resizeObserver = new ResizeObserver(() => {
      calculateFit();
    });

    resizeObserver.observe(input);
    window.addEventListener('resize', calculateFit);

    // Font loading listener to re-measure if custom webfonts render
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(calculateFit);
    }

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateFit);
    };
  }, [inputRef, fullText]);

  return adaptiveText;
}
