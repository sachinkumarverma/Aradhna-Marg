import { useState, useEffect } from 'react';
import { StorageService } from '../common/storage/StorageService';

export const useReadingMode = () => {
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [isDark, setIsDark] = useState(() => StorageService.getReadingMode());

  const toggleReadingMode = () => setIsReadingMode(!isReadingMode);
  
  const toggleDarkMode = () => {
    setIsDark(!isDark);
    StorageService.setReadingMode(!isDark);
  };

  // Lock body scroll if needed, or hide navbar natively
  useEffect(() => {
    if (isReadingMode) {
      document.body.classList.add('reading-mode-active');
    } else {
      document.body.classList.remove('reading-mode-active');
    }
  }, [isReadingMode]);

  return {
    isReadingMode,
    isDark,
    toggleReadingMode,
    toggleDarkMode
  };
};
