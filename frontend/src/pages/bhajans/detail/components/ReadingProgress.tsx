import React from 'react';
import { motion } from 'framer-motion';
import { useReadingProgress } from '../../../../hooks/useReadingProgress';

export const ReadingProgress: React.FC = () => {
  const progress = useReadingProgress();

  return (
    <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-transparent">
      <motion.div
        className="h-full bg-saffron"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
      />
    </div>
  );
};
