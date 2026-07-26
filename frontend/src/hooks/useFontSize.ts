import { useState, useEffect } from 'react';

const FONT_SIZES = [16, 18, 20, 24, 28, 32];
const DEFAULT_INDEX = 2; // 20px

export const useFontSize = () => {
  const [sizeIndex, setSizeIndex] = useState(() => {
    const saved = localStorage.getItem('bhajan-font-size');
    return saved !== null ? parseInt(saved, 10) : DEFAULT_INDEX;
  });

  useEffect(() => {
    localStorage.setItem('bhajan-font-size', sizeIndex.toString());
  }, [sizeIndex]);

  const increaseFont = () => setSizeIndex(prev => Math.min(prev + 1, FONT_SIZES.length - 1));
  const decreaseFont = () => setSizeIndex(prev => Math.max(prev - 1, 0));
  const resetFont = () => setSizeIndex(DEFAULT_INDEX);

  return {
    fontSize: FONT_SIZES[sizeIndex],
    increaseFont,
    decreaseFont,
    resetFont,
    canIncrease: sizeIndex < FONT_SIZES.length - 1,
    canDecrease: sizeIndex > 0,
  };
};
