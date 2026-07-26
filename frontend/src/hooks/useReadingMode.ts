import { useState, useEffect } from 'react';

export const useReadingMode = () => {
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('bhajan-reading-dark') === 'true';
  });

  const toggleReadingMode = () => setIsReadingMode(!isReadingMode);
  
  const toggleDarkMode = () => {
    setIsDark(!isDark);
    localStorage.setItem('bhajan-reading-dark', (!isDark).toString());
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
