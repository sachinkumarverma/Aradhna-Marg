import { useState, useEffect } from 'react';
import { StorageService } from '../common/storage/StorageService';

const FONT_SIZES = [16, 18, 20, 24, 28, 32];
const DEFAULT_INDEX = 2; 

export const useFontSize = () => {
  const [sizeIndex, setSizeIndex] = useState(() => {
    const saved = StorageService.getFontSize();
    return saved !== null ? saved : DEFAULT_INDEX;
  });

  useEffect(() => {
    StorageService.setFontSize(sizeIndex);
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
