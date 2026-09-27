import React, { useEffect, useRef } from 'react';
import { Megaphone, Info } from 'lucide-react';

interface AdUnitProps {
  slot?: 'sidebar' | 'banner' | 'inline';
  className?: string;
  adClient?: string;
  adSlotId?: string;
  adCode?: string;
  label?: string;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export const AdUnit: React.FC<AdUnitProps> = ({
  slot = 'sidebar',
  className = '',
  adClient,
  adSlotId,
  adCode,
  label = 'ADVERTISEMENT • विज्ञापन'
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const pushedRef = useRef<boolean>(false);

  useEffect(() => {
    if (adCode) return;

    try {
      if (typeof window !== 'undefined' && adRef.current) {
        if (!pushedRef.current) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushedRef.current = true;
        }
      }
    } catch (err) {
      console.warn('AdSense auto-push warning:', err);
    }
  }, [adCode]);

  return (
    <div
      className={`relative w-full rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 p-4 shadow-xs overflow-hidden transition-all ${className}`}
    >
      {/* Top Header Label */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-amber-200/40 text-[11px] font-bold tracking-wider text-amber-800/80 uppercase">
        <span className="flex items-center gap-1.5 text-saffron">
          <Megaphone className="w-3.5 h-3.5" />
          {label}
        </span>
        <span title="Sponsored Content / Ads" className="text-gray-400 hover:text-gray-600 transition-colors">
          <Info className="w-3.5 h-3.5" />
        </span>
      </div>

      {/* Ad Container Box */}
      <div
        ref={adRef}
        className="w-full flex items-center justify-center min-h-[250px] overflow-hidden rounded-xl bg-white/70 border border-dashed border-amber-300/50 relative"
      >
        {adCode ? (
          <div dangerouslySetInnerHTML={{ __html: adCode }} className="w-full flex items-center justify-center" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
            <ins
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', minHeight: '250px' }}
              data-ad-client={adClient || 'ca-pub-XXXXXXXXXXXXXXXX'}
              data-ad-slot={adSlotId || '1234567890'}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
            {/* Soft fallback preview before AdSense loads script */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 text-amber-900/40 bg-gradient-to-b from-amber-50/20 to-orange-50/20 -z-0">
              <div className="w-12 h-12 rounded-full bg-amber-100/80 flex items-center justify-center mb-2 shadow-xs">
                <Megaphone className="w-6 h-6 text-saffron/70" />
              </div>
              <p className="text-xs font-bold text-darkBrown/70 uppercase tracking-widest">Google AdSense Area</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Automatic Display & Native Ads</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
