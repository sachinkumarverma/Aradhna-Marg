import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/SettingsService';
import { updateSettingsSchema } from '../validators/settings.validator';
import { sendSuccess } from '../responses/apiResponse';
import { ValidationError } from '../errors/appError';

export class SettingsController {
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.getSettings();
      return sendSuccess(res, 'Settings retrieved successfully', settings);
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const parsedBody = updateSettingsSchema.safeParse(req.body);
      
      if (!parsedBody.success) {
        throw new ValidationError('Validation failed', parsedBody.error.format());
      }

      const updatedSettings = await settingsService.updateSettings(parsedBody.data);
      return sendSuccess(res, 'Settings updated successfully', updatedSettings);
    } catch (error) {
      next(error);
    }
  }
}

export const settingsController = new SettingsController();
