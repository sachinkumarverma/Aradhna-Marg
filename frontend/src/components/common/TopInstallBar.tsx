import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '@i18n/LanguageContext';
import { usePWAInstall } from '@hooks/usePWAInstall';

export const TopInstallBar: React.FC = () => {
  const { language } = useTranslation();
  const isHi = language === 'hi';
  const { isInstalled, hasNativePrompt, isIOS, showIOSPrompt, setShowIOSPrompt, installApp } = usePWAInstall();

  // In-memory state only (so page refresh immediately restores the bar)
  const [isDismissed, setIsDismissed] = useState(false);

  // Clean up any previously saved storage flag from older versions
  useEffect(() => {
    try {
      sessionStorage.removeItem('am_pwa_topbar_dismissed');
      localStorage.removeItem('am_pwa_topbar_dismissed');
    } catch {
      // Ignore storage access errors in restricted browser environments
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const handleInstall = async () => {
    if (hasNativePrompt) {
      await installApp();
    } else if (isIOS) {
      setShowIOSPrompt(true);
    } else {
      toast(
        isHi
          ? 'ब्राउज़र एड्रेस बार (⊕) या मेनू (⋮) से "Install App" चुनें।'
          : 'Select "Install App" from the browser address bar icon (⊕) or menu (⋮).',
        {
          id: 'topbar-pwa-install-instruction',
          icon: '📲',
          position: 'top-center',
          duration: 4000,
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            borderRadius: '16px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
            maxWidth: '92vw',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            zIndex: 99999
          }
        }
      );
    }
  };

  // Do not show if already running as installed standalone app or dismissed for this session
  if (isInstalled || isDismissed) {
    return null;
  }

  // If browser is desktop/Android but doesn't have native prompt yet and is not iOS,
  // we still display the sleek bar if isInstallable or fallback so user can install directly
  return (
    <>
      <div
        className="w-full shrink-0 z-50 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 text-white border-b border-orange-500/30 shadow-2xs h-[34px] sm:h-[38px] flex items-center px-2.5 sm:px-4 text-[11px] sm:text-xs select-none"
        style={{
          fontFamily: "'Inter', 'Anek Devanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Center / Left Content */}
          <div className="flex-1 flex items-center justify-center min-w-0 gap-1.5 sm:gap-2.5 truncate">
            <Sparkles className="w-3.5 h-3.5 text-amber-100 shrink-0 opacity-90" />

            {/* Mobile Single-line Concise Text vs Desktop Full Text */}
            <p className="font-medium tracking-normal text-[11.5px] sm:text-[12.5px] truncate whitespace-nowrap text-white/95">
              <span className="inline sm:hidden">
                {isHi ? 'आराधना मार्ग ऐप इंस्टॉल करें' : 'Install Aradhna Marg App'}
              </span>
              <span className="hidden sm:inline">
                {isHi
                  ? 'बिना ब्राउज़र तेज़ व सुगम अनुभव के लिए आराधना मार्ग ऐप इंस्टॉल करें'
                  : 'Install the Aradhna Marg app for a faster, fullscreen devotional experience'}
              </span>
            </p>

            {/* Install CTA Button */}
            <button
              type="button"
              onClick={handleInstall}
              className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 h-[23px] sm:h-[25px] rounded-full bg-white hover:bg-amber-50 active:scale-95 text-[#c2410c] font-semibold text-[11px] sm:text-[11.5px] shadow-xs hover:shadow-sm transition-all shrink-0 cursor-pointer whitespace-nowrap ml-1 sm:ml-2.5"
              title={isHi ? 'ऐप इंस्टॉल करें' : 'Install App'}
            >
              <Download className="w-3.5 h-3.5 stroke-[2.2] shrink-0" />
              <span className="leading-none">{isHi ? 'इंस्टॉल' : 'Install'}</span>
            </button>
          </div>

          {/* Right: Dismiss 'X' Button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="w-5 h-5 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors shrink-0 cursor-pointer ml-1"
            title={isHi ? 'हटाएँ' : 'Dismiss'}
            aria-label="Dismiss banner"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* iOS Safari Add to Home Screen Instructions Modal */}
      {showIOSPrompt && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-orange-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2 font-hindi-heading">
                <Smartphone className="w-5 h-5 text-saffron" />
                {isHi ? 'iPhone / iPad पर इंस्टॉल करें' : 'Install on iPhone / iPad'}
              </h4>
              <button
                type="button"
                onClick={() => setShowIOSPrompt(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-slate-600 font-hindi-body">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-saffron font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  {isHi ? (
                    <>
                      Safari में नीचे मौजूद <strong>Share (शेयर)</strong> बटन पर टैप करें।
                    </>
                  ) : (
                    <>
                      Tap the <strong>Share</strong> button in Safari's bottom toolbar.
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-saffron font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  {isHi ? (
                    <>
                      नीचे स्क्रॉल करें और <strong>'Add to Home Screen'</strong> (होम स्क्रीन में जोड़ें) चुनें।
                    </>
                  ) : (
                    <>
                      Scroll down and select <strong>'Add to Home Screen'</strong>.
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-saffron font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  {isHi ? (
                    <>
                      ऊपर दाईं ओर <strong>'Add'</strong> पर टैप करें।
                    </>
                  ) : (
                    <>
                      Tap <strong>'Add'</strong> in the top right corner.
                    </>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowIOSPrompt(false)}
              className="w-full py-2.5 bg-saffron hover:bg-saffron-dark text-white rounded-xl font-bold text-sm transition-colors cursor-pointer"
            >
              {isHi ? 'समझ गया' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
