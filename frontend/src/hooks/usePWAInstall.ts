import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@api/client';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const STORAGE_KEY = 'am_pwa_installed_recorded';

const recordInstallOnBackend = async (platform: 'android' | 'ios' | 'desktop') => {
  try {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    localStorage.setItem(STORAGE_KEY, 'true');

    // Notify backend counter
    await apiClient.post('/public/analytics/pwa-install', { platform });

    // Also notify Google Analytics if active
    if ((window as any).gtag) {
      (window as any).gtag('event', 'pwa_install', {
        platform,
        event_category: 'PWA',
        event_label: 'App Installed'
      });
    }
  } catch (err) {
    console.debug('Failed to record PWA install:', err);
  }
};

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already running in standalone mode (installed PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://') ||
      window.location.search.includes('source=pwa');

    setIsInstalled(isStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // If opened in standalone mode for the first time, record install
    if (isStandalone) {
      const platform = isIOSDevice ? 'ios' : window.innerWidth < 768 ? 'android' : 'desktop';
      recordInstallOnBackend(platform);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      const platform = isIOSDevice ? 'ios' : window.innerWidth < 768 ? 'android' : 'desktop';
      recordInstallOnBackend(platform);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          const platform = isIOS ? 'ios' : window.innerWidth < 768 ? 'android' : 'desktop';
          recordInstallOnBackend(platform);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.debug('PWA install error:', err);
      }
    } else if (isIOS) {
      setShowIOSPrompt(true);
    }
  }, [deferredPrompt, isIOS]);

  return {
    isInstallable: !isInstalled && (!!deferredPrompt || isIOS),
    hasNativePrompt: !!deferredPrompt,
    isInstalled,
    isIOS,
    showIOSPrompt,
    setShowIOSPrompt,
    installApp
  };
}
