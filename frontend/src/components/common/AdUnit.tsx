import React, { useEffect, useRef, useState } from 'react';
import { Megaphone, Info, ShieldAlert } from 'lucide-react';
import { getConfiguredPublisherId, isValidPublisherId, isValidSlotId, loadAdSenseScript } from '@/utils/adsense';

interface AdUnitProps {
  slot?: 'sidebar' | 'banner' | 'inline';
  className?: string;
  adClient?: string;
  adSlotId?: string;
  adCode?: string;
  label?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
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
  label = 'ADVERTISEMENT • विज्ञापन',
  format = 'auto',
  responsive = true
}) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  const isPushedRef = useRef<boolean>(false);
  const [adError, setAdError] = useState(false);

  // Active publisher ID: passed as prop or configured in environment
  const activePublisherId = adClient || getConfiguredPublisherId();
  const hasValidPublisher = isValidPublisherId(activePublisherId);
  const hasValidSlot = isValidSlotId(adSlotId);
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    // If custom HTML embed code is provided, no adsbygoogle push required
    if (adCode) return;

    // Only proceed if valid publisher & slot IDs are available
    if (!hasValidPublisher || !hasValidSlot || !activePublisherId) {
      return;
    }

    // Load AdSense script once
    loadAdSenseScript(activePublisherId);

    // Guard against double pushing in React 18/19 Strict Mode
    const insEl = insRef.current;
    if (!insEl) return;

    // Check if AdSense has already processed this ins tag
    const isAlreadyFilled =
      insEl.getAttribute('data-adsbygoogle-status') === 'done' ||
      insEl.getAttribute('data-ad-status') === 'filled' ||
      isPushedRef.current;

    if (isAlreadyFilled) return;

    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isPushedRef.current = true;
      }
    } catch (err) {
      console.warn('Google AdSense push notice:', err);
      setAdError(true);
    }
  }, [adCode, activePublisherId, adSlotId, hasValidPublisher, hasValidSlot]);

  // If custom HTML snippet is provided, render it safely
  if (adCode) {
    return (
      <div
        className={`relative w-full rounded-xl sm:rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 p-3 sm:p-4 shadow-xs overflow-hidden transition-all ${className}`}
      >
        <div className="flex items-center justify-between pb-1.5 sm:pb-2 mb-2 sm:mb-3 border-b border-amber-200/40 text-[10px] sm:text-[11px] font-bold tracking-wider text-amber-800/80 uppercase">
          <span className="flex items-center gap-1.5 text-saffron">
            <Megaphone className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            {label}
          </span>
          <span title="Sponsored Content" className="text-gray-400 hover:text-gray-600 transition-colors">
            <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          </span>
        </div>
        <div
          dangerouslySetInnerHTML={{ __html: adCode }}
          className="w-full flex items-center justify-center min-h-[140px] overflow-hidden"
        />
      </div>
    );
  }

  // If IDs are missing or invalid:
  // In Development: Show informative developer placeholder
  // In Production: Gracefully hide container (return null) without broken boxes or layout shifts
  if (!hasValidPublisher || !hasValidSlot) {
    if (!isDev) {
      return null;
    }

    return (
      <div
        className={`relative w-full rounded-xl sm:rounded-2xl border border-dashed border-amber-300/60 bg-amber-50/40 p-4 shadow-xs overflow-hidden text-center transition-all ${className}`}
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200/50 text-[10px] font-bold tracking-wider text-amber-800 uppercase">
          <span className="flex items-center gap-1 text-saffron">
            <Megaphone className="w-3 h-3 shrink-0" />
            {label} (Dev Preview)
          </span>
          <span className="text-amber-500 font-medium">Slot: {slot}</span>
        </div>
        <div className="py-4 px-2 flex flex-col items-center justify-center text-amber-900/60">
          <ShieldAlert className="w-6 h-6 text-amber-500 mb-1" />
          <p className="text-xs font-bold text-darkBrown">AdSense Placement Placeholder</p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
            {!hasValidPublisher
              ? 'Configure VITE_ADSENSE_PUBLISHER_ID (e.g. ca-pub-XXXXXXXXXXXXXXXX) in .env to activate live ads.'
              : 'Pass a valid adSlotId prop to render this ad unit.'}
          </p>
        </div>
      </div>
    );
  }

  // Determine min-height based on slot type to prevent Cumulative Layout Shift (CLS)
  const minHeightClass =
    slot === 'banner'
      ? 'min-h-[90px] sm:min-h-[120px]'
      : slot === 'inline'
        ? 'min-h-[140px] sm:min-h-[180px]'
        : 'min-h-[250px] sm:min-h-[280px]';

  return (
    <div
      ref={adContainerRef}
      className={`relative w-full rounded-xl sm:rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 p-3 sm:p-4 shadow-xs overflow-hidden transition-all ${className}`}
    >
      {/* Top Header Label */}
      <div className="flex items-center justify-between pb-1.5 sm:pb-2 mb-2 sm:mb-3 border-b border-amber-200/40 text-[10px] sm:text-[11px] font-bold tracking-wider text-amber-800/80 uppercase">
        <span className="flex items-center gap-1.5 text-saffron">
          <Megaphone className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          {label}
        </span>
        <span title="Google AdSense" className="text-gray-400 hover:text-gray-600 transition-colors">
          <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
        </span>
      </div>

      {/* Ad Container Box */}
      <div
        className={`w-full flex items-center justify-center overflow-hidden rounded-lg sm:rounded-xl bg-white/50 relative ${minHeightClass}`}
      >
        {adError ? (
          <div className="text-xs text-slate-400 py-4">Ad unavailable</div>
        ) : (
          <ins
            ref={insRef}
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', minHeight: '100%' }}
            data-ad-client={activePublisherId}
            data-ad-slot={adSlotId}
            data-ad-format={format}
            data-full-width-responsive={responsive ? 'true' : 'false'}
          />
        )}
      </div>
    </div>
  );
};
