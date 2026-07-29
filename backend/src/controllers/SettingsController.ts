import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/SettingsService';
import {
  updateSettingsSchema,
  generalSettingsSchema,
  contactSettingsSchema,
  socialSettingsSchema,
  youtubeSettingsSchema,
  seoSettingsSchema,
  analyticsSettingsSchema,
  advertisementSettingsSchema,
  systemSettingsSchema,
} from '../validators/settings.validator';
import { sendSuccess } from '../responses/apiResponse';
import { ValidationError } from '../errors/appError';

/** Generic helper: validate with a schema and persist only that section's fields */
async function updateSection(
  schema: { safeParse: (data: unknown) => any },
  req: Request,
  res: Response,
  next: NextFunction,
  successMsg: string,
) {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', parsed.error.format());
    }
    const updated = await settingsService.updateSettings(parsed.data);
    return sendSuccess(res, successMsg, updated);
  } catch (error) {
    next(error);
  }
}

export class SettingsController {
  // ── Full read ──────────────────────────────────────────────────────────────
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.getSettings();
      return sendSuccess(res, 'Settings retrieved successfully', settings);
    } catch (error) {
      next(error);
    }
  }

  // ── Legacy full-update (kept for backward compatibility) ───────────────────
  async updateSettings(req: Request, res: Response, next: NextFunction) {
    return updateSection(updateSettingsSchema, req, res, next, 'Settings updated successfully');
  }

  // ── Per-section handlers ───────────────────────────────────────────────────
  async updateGeneral(req: Request, res: Response, next: NextFunction) {
    return updateSection(generalSettingsSchema, req, res, next, 'General settings saved');
  }

  async updateContact(req: Request, res: Response, next: NextFunction) {
    return updateSection(contactSettingsSchema, req, res, next, 'Contact settings saved');
  }

  async updateSocial(req: Request, res: Response, next: NextFunction) {
    return updateSection(socialSettingsSchema, req, res, next, 'Social settings saved');
  }

  async updateYoutube(req: Request, res: Response, next: NextFunction) {
    return updateSection(youtubeSettingsSchema, req, res, next, 'YouTube settings saved');
  }

  async updateSeo(req: Request, res: Response, next: NextFunction) {
    return updateSection(seoSettingsSchema, req, res, next, 'SEO settings saved');
  }

  async updateAnalytics(req: Request, res: Response, next: NextFunction) {
    return updateSection(analyticsSettingsSchema, req, res, next, 'Analytics settings saved');
  }

  async updateAdvertisement(req: Request, res: Response, next: NextFunction) {
    return updateSection(advertisementSettingsSchema, req, res, next, 'Advertisement settings saved');
  }

  async updateSystem(req: Request, res: Response, next: NextFunction) {
    return updateSection(systemSettingsSchema, req, res, next, 'System settings saved');
  }
}

export const settingsController = new SettingsController();

