import React, { useEffect, useRef } from 'react';
import { getConfiguredPublisherId, loadAdSenseScript } from '@utils/adsense';

interface AdBannerProps {
  htmlCode?: string;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ htmlCode, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !htmlCode) return;

    let active = true;
    const renderAd = async () => {
      const configuredPublisherId = getConfiguredPublisherId();
      const embeddedPublisherId = htmlCode.match(/client=(ca-pub-\d{10,20})/)?.[1];
      if (htmlCode.includes('adsbygoogle') && (configuredPublisherId || embeddedPublisherId)) {
        await loadAdSenseScript(configuredPublisherId || embeddedPublisherId || '');
      }

      if (!active || !containerRef.current) return;

      containerRef.current.innerHTML = '';
      const range = document.createRange();
      range.selectNode(containerRef.current);
      const documentFragment = range.createContextualFragment(htmlCode);
      containerRef.current.appendChild(documentFragment);
    };

    void renderAd();
    return () => {
      active = false;
    };
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
