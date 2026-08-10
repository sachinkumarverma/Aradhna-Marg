"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibreTranslateProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const appError_1 = require("@/errors/appError");
class LibreTranslateProvider {
    name = 'libretranslate';
    async translate(text, sourceLang, targetLang, format = 'text') {
        const url = process.env.LIBRETRANSLATE_URL;
        if (!url) {
            throw new appError_1.AppError('LibreTranslate URL is not configured.', 500);
        }
        try {
            const response = await axios_1.default.post(`${url}/translate`, {
                q: text,
                source: sourceLang,
                target: targetLang,
                format: format,
                api_key: process.env.LIBRETRANSLATE_API_KEY || ''
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000 // 10 second timeout for LibreTranslate
            });
            return response.data.translatedText;
        }
        catch (error) {
            throw new appError_1.AppError(`LibreTranslate failed: ${error.message}`, 502);
        }
    }
}
exports.LibreTranslateProvider = LibreTranslateProvider;
