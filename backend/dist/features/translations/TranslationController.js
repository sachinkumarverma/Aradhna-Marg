"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translationController = exports.TranslationController = void 0;
const TranslationService_1 = require("./TranslationService");
const TranslationRepository_1 = require("./TranslationRepository");
const apiResponse_1 = require("@/responses/apiResponse");
class TranslationController {
    async generateTranslation(req, res, next) {
        try {
            const { contentType, contentId, sourceLang, targetLang } = req.body;
            const translation = await TranslationService_1.translationService.generateTranslation(contentType, contentId, sourceLang, targetLang);
            return (0, apiResponse_1.sendSuccess)(res, 'Translation generated successfully', translation);
        }
        catch (error) {
            next(error);
        }
    }
    async generateLiveTranslation(req, res, next) {
        try {
            const { content, sourceLang, targetLang } = req.body;
            const result = await TranslationService_1.translationService.generateLiveTranslation(content, sourceLang, targetLang);
            return (0, apiResponse_1.sendSuccess)(res, 'Translation generated successfully', result);
        }
        catch (error) {
            next(error);
        }
    }
    async upsertTranslation(req, res, next) {
        try {
            const dto = req.body;
            const translation = await TranslationRepository_1.translationRepository.upsertTranslation(dto);
            return (0, apiResponse_1.sendSuccess)(res, 'Translation upserted successfully', translation);
        }
        catch (error) {
            next(error);
        }
    }
    async getTranslation(req, res, next) {
        try {
            const { contentType, contentId, targetLanguage } = req.params;
            const translation = await TranslationRepository_1.translationRepository.getTranslation(contentType, contentId, targetLanguage);
            if (!translation) {
                return res.status(404).json({ success: false, message: 'Translation not found' });
            }
            return (0, apiResponse_1.sendSuccess)(res, 'Translation retrieved successfully', translation);
        }
        catch (error) {
            next(error);
        }
    }
    async updateTranslation(req, res, next) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const translation = await TranslationRepository_1.translationRepository.updateTranslationStatus(id, updates);
            return (0, apiResponse_1.sendSuccess)(res, 'Translation updated successfully', translation);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TranslationController = TranslationController;
exports.translationController = new TranslationController();
