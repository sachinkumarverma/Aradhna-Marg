"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translationService = exports.TranslationService = void 0;
const LibreTranslateProvider_1 = require("./LibreTranslateProvider");
const GoogleTranslateProvider_1 = require("./GoogleTranslateProvider");
const TranslationRepository_1 = require("./TranslationRepository");
const DatabaseClient_1 = require("../../common/database/DatabaseClient");
const appError_1 = require("../../errors/appError");
const logger_1 = require("../../utils/logger");
class TranslationService {
    libreProvider;
    googleProvider;
    constructor() {
        this.libreProvider = new LibreTranslateProvider_1.LibreTranslateProvider();
        this.googleProvider = new GoogleTranslateProvider_1.GoogleTranslateProvider();
    }
    async translateHtml(html, sourceLang, targetLang) {
        return this.executeWithFallback(html, sourceLang, targetLang, 'html');
    }
    async translateText(text, sourceLang, targetLang) {
        return this.executeWithFallback(text, sourceLang, targetLang, 'text');
    }
    async generateTranslation(contentType, contentId, sourceLang, targetLang) {
        if (sourceLang === targetLang) {
            throw new appError_1.AppError('Source and target languages must be different.', 400);
        }
        let sourceContent;
        try {
            if (contentType === 'ARTICLE') {
                const res = await DatabaseClient_1.db.query(`SELECT title, excerpt, content, seo_title, seo_description FROM articles WHERE id = $1`, [contentId]);
                sourceContent = res.rows[0];
            }
            else if (contentType === 'PURAN') {
                const res = await DatabaseClient_1.db.query(`SELECT title, description, seo_title, seo_description FROM puranas WHERE id = $1`, [contentId]);
                sourceContent = res.rows[0];
            }
            else if (contentType === 'FESTIVAL') {
                const res = await DatabaseClient_1.db.query(`SELECT name as title, description, seo_title, seo_description FROM festivals WHERE id = $1`, [contentId]);
                sourceContent = res.rows[0];
            }
        }
        catch (e) {
            throw new appError_1.AppError(`Failed to fetch source content for ${contentType}`, 500);
        }
        if (!sourceContent) {
            throw new appError_1.AppError(`${contentType} not found`, 404);
        }
        // Prepare translation DTO
        const dto = {
            contentType,
            contentId,
            sourceLanguage: sourceLang,
            targetLanguage: targetLang,
            translationStatus: 'GENERATING',
            sourceVersion: 1 // Default, could be queried from source row if tracked
        };
        // First save the state as GENERATING
        await TranslationRepository_1.translationRepository.upsertTranslation(dto);
        let lastProvider = 'none';
        try {
            // Helper to translate safely
            const safeTrans = async (text, format = 'text') => {
                if (!text)
                    return null;
                const res = await this.executeWithFallback(text, sourceLang, targetLang, format);
                lastProvider = res.provider;
                return res.translated;
            };
            if (contentType === 'ARTICLE') {
                dto.title = await safeTrans(sourceContent.title) || undefined;
                dto.excerpt = await safeTrans(sourceContent.excerpt) || undefined;
                dto.content = await safeTrans(sourceContent.content, 'html') || undefined;
                dto.seoTitle = await safeTrans(sourceContent.seo_title) || undefined;
                dto.seoDescription = await safeTrans(sourceContent.seo_description) || undefined;
            }
            else if (contentType === 'PURAN') {
                dto.title = await safeTrans(sourceContent.title) || undefined;
                dto.description = await safeTrans(sourceContent.description, 'html') || undefined;
                dto.seoTitle = await safeTrans(sourceContent.seo_title) || undefined;
                dto.seoDescription = await safeTrans(sourceContent.seo_description) || undefined;
            }
            else if (contentType === 'FESTIVAL') {
                dto.title = await safeTrans(sourceContent.title) || undefined;
                dto.description = await safeTrans(sourceContent.description) || undefined;
                // Wait, festivals table doesn't have 'festival_details', only 'description'.
                // Assuming 'description' holds the rich text details as per schema check.
                dto.seoTitle = await safeTrans(sourceContent.seo_title) || undefined;
                dto.seoDescription = await safeTrans(sourceContent.seo_description) || undefined;
            }
            dto.provider = lastProvider;
            dto.translationStatus = 'NEEDS_REVIEW';
            return await TranslationRepository_1.translationRepository.upsertTranslation(dto);
        }
        catch (error) {
            logger_1.logger.error('Translation Generation Failed', error);
            dto.translationStatus = 'FAILED';
            await TranslationRepository_1.translationRepository.upsertTranslation(dto);
            throw new appError_1.AppError('Translation failed. Review logs for details.', 500);
        }
    }
    async generateLiveTranslation(content, sourceLang, targetLang) {
        if (sourceLang === targetLang) {
            throw new appError_1.AppError('Source and target languages must be different.', 400);
        }
        let lastProvider = 'none';
        const translatedContent = {};
        const safeTrans = async (text, format = 'text') => {
            if (!text)
                return null;
            const res = await this.executeWithFallback(text, sourceLang, targetLang, format);
            lastProvider = res.provider;
            return res.translated;
        };
        try {
            for (const [key, value] of Object.entries(content)) {
                if (!value)
                    continue;
                const format = (key === 'content' || key === 'description' || key === 'short_description') ? 'html' : 'text';
                translatedContent[key] = await safeTrans(value, format) || undefined;
            }
            return { translations: translatedContent, provider: lastProvider };
        }
        catch (error) {
            logger_1.logger.error('Live Translation Generation Failed', error);
            throw new appError_1.AppError('Live Translation failed. Review logs for details.', 500);
        }
    }
    async executeWithFallback(text, sourceLang, targetLang, format) {
        if (!text || text.trim() === '') {
            return { translated: '', provider: 'none' };
        }
        const providerSelection = process.env.TRANSLATION_PROVIDER || 'google';
        let primaryProvider = this.googleProvider;
        let secondaryProvider = this.libreProvider;
        if (providerSelection === 'libretranslate') {
            primaryProvider = this.libreProvider;
            secondaryProvider = this.googleProvider;
        }
        try {
            const translated = await primaryProvider.translate(text, sourceLang, targetLang, format);
            return { translated, provider: primaryProvider.name };
        }
        catch (error) {
            logger_1.logger.warn(`Primary translation provider (${primaryProvider.name}) failed: ${error.message}. Attempting fallback...`);
            try {
                const translated = await secondaryProvider.translate(text, sourceLang, targetLang, format);
                return { translated, provider: secondaryProvider.name };
            }
            catch (fallbackError) {
                logger_1.logger.error(`Fallback translation provider (${secondaryProvider.name}) also failed: ${fallbackError.message}`);
                throw new appError_1.AppError('All translation providers failed.', 502);
            }
        }
    }
}
exports.TranslationService = TranslationService;
exports.translationService = new TranslationService();
