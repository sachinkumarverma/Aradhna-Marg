import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  htmlCode?: string;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ htmlCode, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !htmlCode) return;

    // Reset container
    containerRef.current.innerHTML = '';

    // Create a range to execute any embedded <script> tags properly
    const range = document.createRange();
    range.selectNode(containerRef.current);
    const documentFragment = range.createContextualFragment(htmlCode);
    containerRef.current.appendChild(documentFragment);
  }, [htmlCode]);

  if (!htmlCode || !htmlCode.trim()) {
    return null;
  }

  return (
    <div className={`w-full flex items-center justify-center overflow-hidden my-3 ${className}`}>
      <div ref={containerRef} className="max-w-full" />
    </div>
  );
};
