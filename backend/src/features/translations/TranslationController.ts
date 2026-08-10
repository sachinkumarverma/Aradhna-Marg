import { Request, Response, NextFunction } from 'express';
import { translationService } from './TranslationService';
import { translationRepository } from './TranslationRepository';
import { ContentType } from './TranslationTypes';
import { sendSuccess } from '@/responses/apiResponse';

export class TranslationController {
  async generateTranslation(req: Request, res: Response, next: NextFunction) {
    try {
      const { contentType, contentId, sourceLang, targetLang } = req.body;
      const translation = await translationService.generateTranslation(
        contentType as any,
        contentId as string,
        sourceLang as string,
        targetLang as string
      );
      return sendSuccess(res, 'Translation generated successfully', translation);
    } catch (error) {
      next(error);
    }
  }

  async generateLiveTranslation(req: Request, res: Response, next: NextFunction) {
    try {
      const { content, sourceLang, targetLang } = req.body;
      const result = await translationService.generateLiveTranslation(
        content,
        sourceLang,
        targetLang
      );
      return sendSuccess(res, 'Translation generated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async upsertTranslation(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = req.body;
      const translation = await translationRepository.upsertTranslation(dto);
      return sendSuccess(res, 'Translation upserted successfully', translation);
    } catch (error) {
      next(error);
    }
  }

  async getTranslation(req: Request, res: Response, next: NextFunction) {
    try {
      const { contentType, contentId, targetLanguage } = req.params;
      const translation = await translationRepository.getTranslation(
        contentType as any,
        contentId as string,
        targetLanguage as string
      );
      
      if (!translation) {
        return res.status(404).json({ success: false, message: 'Translation not found' });
      }

      return sendSuccess(res, 'Translation retrieved successfully', translation);
    } catch (error) {
      next(error);
    }
  }

  async updateTranslation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const translation = await translationRepository.updateTranslationStatus(id as string, updates);
      return sendSuccess(res, 'Translation updated successfully', translation);
    } catch (error) {
      next(error);
    }
  }
}

export const translationController = new TranslationController();
