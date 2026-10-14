import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PublicApi, type PublicSettings } from '@api/publicApi';

function getCachedMaintenanceMode(): boolean {
  try {
    return sessionStorage.getItem('am_maintenance_mode') === 'true';
  } catch {
    return false;
  }
}

const DEFAULT_SETTINGS: PublicSettings = {
  siteName: 'Aradhna Marg',
  copyrightText: 'समस्त अधिकार सुरक्षित। सनातन धर्म सेवा हेतु समर्पित।',
  contactEmail: 'support@aradhnamarg.com',
  contactAddress: '',
  contactPhone: '',
  facebookUrl: 'https://facebook.com/sachinkumarverma2001',
  instagramUrl: 'https://instagram.com/thebhaktimarg_official',
  youtubeUrl: 'https://youtube.com/@thebhaktimarg_official',
  twitterUrl: '',
  enableAnalytics: false,
  googleAnalyticsId: '',
  microsoftClarity: '',
  enableAds: false,
  adTopBanner: '',
  adInline: '',
  adFooter: '',
  maintenanceMode: false
};

export function usePublicSettings() {
  const [forcedMaintenance, setForcedMaintenance] = useState<boolean>(() => getCachedMaintenanceMode());

  const {
    data: rawSettings,
    isLoading,
    error,
    refetch
  } = useQuery<PublicSettings>({
    queryKey: ['public-settings'],
    queryFn: () => PublicApi.getSettings(),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true
  });

  // Sync session storage and forced state when fresh data arrives
  useEffect(() => {
    if (rawSettings && typeof rawSettings.maintenanceMode === 'boolean') {
      setForcedMaintenance(rawSettings.maintenanceMode);
      try {
        sessionStorage.setItem('am_maintenance_mode', String(rawSettings.maintenanceMode));
      } catch {
        // ignore
      }
    }
  }, [rawSettings]);

  // Reactive listener: locks the UI the instant ANY public API call encounters maintenance mode
  useEffect(() => {
    const onMaintenanceActive = () => {
      setForcedMaintenance(true);
      refetch();
    };
    window.addEventListener('maintenance-mode-active', onMaintenanceActive);
    return () => window.removeEventListener('maintenance-mode-active', onMaintenanceActive);
  }, [refetch]);

  const isMaintenanceActive =
    forcedMaintenance ||
    (rawSettings?.maintenanceMode !== undefined ? Boolean(rawSettings.maintenanceMode) : getCachedMaintenanceMode());

  const settings: PublicSettings = {
    ...DEFAULT_SETTINGS,
    ...(rawSettings || {}),
    maintenanceMode: isMaintenanceActive
  };

  return {
    settings,
    isLoading,
    error,
    refetch
  };
}
