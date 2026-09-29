import React from 'react';

interface CustomLoaderProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

export const CustomLoader: React.FC<CustomLoaderProps> = ({ fullScreen = true, className = '' }) => {
  if (fullScreen) {
    return (
      <div className={`w-full min-h-[50vh] flex-1 flex items-center justify-center py-16 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron"></div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-saffron"></div>
    </div>
  );
};
