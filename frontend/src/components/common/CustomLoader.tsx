import React from 'react';

interface CustomLoaderProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  subtext?: string;
  className?: string;
}

const sizeMap = {
  sm: {
    outer: 'w-6 h-6 border-2',
    text: 'text-xs'
  },
  md: {
    outer: 'w-9 h-9 border-2',
    text: 'text-sm'
  },
  lg: {
    outer: 'w-12 h-12 border-[3px]',
    text: 'text-sm sm:text-base'
  },
  xl: {
    outer: 'w-14 h-14 border-[3px]',
    text: 'text-base font-semibold'
  }
};

export const CustomLoader: React.FC<CustomLoaderProps> = ({
  fullScreen = true,
  size = 'lg',
  text,
  subtext,
  className = ''
}) => {
  const selectedSize = sizeMap[size] || sizeMap.lg;

  const content = (
    <div className="flex flex-col items-center justify-center text-center">
      {/* Animated Custom Saffron Spinner */}
      <div className="relative flex items-center justify-center mb-3.5">
        {/* Background track circle */}
        <div className={`${selectedSize.outer} rounded-full border-orange-100`} />
        {/* Animated spinning saffron arc */}
        <div
          className={`absolute ${selectedSize.outer} rounded-full border-transparent border-t-saffron border-r-saffron animate-spin`}
        />
        {/* Center glowing dot */}
        <div className="absolute w-2 h-2 rounded-full bg-saffron animate-pulse" />
      </div>

      {text && <p className={`${selectedSize.text} text-gray-800 tracking-tight font-medium`}>{text}</p>}
      {subtext && <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">{subtext}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`w-full min-h-[50vh] flex-1 flex items-center justify-center py-12 ${className}`}>{content}</div>
    );
  }

  return <div className={`flex items-center justify-center py-4 ${className}`}>{content}</div>;
};
