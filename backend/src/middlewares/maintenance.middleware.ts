import { Request, Response, NextFunction } from 'express';
import { publicCacheService } from '@services/PublicCacheService';
import { settingsRepository } from '@repositories/SettingsRepository';

/**
 * Middleware that guards public API endpoints when the platform is in maintenance mode.
 * Returns HTTP 503 with maintenance metadata so the client can immediately lock the UI.
 * The /settings endpoint is explicitly exempted so the frontend can check status.
 */
export async function requireActiveSite(req: Request, res: Response, next: NextFunction) {
  try {
    // Exempt status check / settings endpoint
    if (req.path === '/settings' || req.path === '/v1/public/settings') {
      return next();
    }

    let isMaintenance = publicCacheService.get<boolean>('maintenance_mode')?.data;
    if (isMaintenance === undefined || isMaintenance === null) {
      const settings = await settingsRepository.getSettings();
      isMaintenance = Boolean(settings?.maintenanceMode);
      publicCacheService.set('maintenance_mode', isMaintenance, 60);
    }

    if (isMaintenance) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return res.status(503).json({
        success: false,
        maintenance: true,
        message: 'Aradhna Marg is currently undergoing scheduled maintenance. Please check back shortly.'
      });
    }

    return next();
  } catch (error) {
    // In case of error checking settings, fail open so user traffic is not disrupted
    return next();
  }
}
