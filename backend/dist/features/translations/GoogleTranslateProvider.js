"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleTranslateProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const appError_1 = require("@/errors/appError");
class GoogleTranslateProvider {
    name = 'google';
    async translate(text, sourceLang, targetLang, format = 'text') {
        const isEnabled = process.env.GOOGLE_TRANSLATE_ENABLED !== 'false'; // Default to true now
        if (!isEnabled) {
            throw new appError_1.AppError('Google Translate is disabled in configuration.', 500);
        }
        const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
        try {
            if (apiKey) {
                // Use official API if key is provided
                const response = await axios_1.default.post(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
                    q: text,
                    source: sourceLang === 'hi' ? 'hi' : sourceLang,
                    target: targetLang === 'en' ? 'en' : targetLang,
                    format: format,
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000
                });
                if (response.data?.data?.translations && response.data.data.translations.length > 0) {
                    return response.data.data.translations[0].translatedText;
                }
            }
            else {
                // Fallback to free GTX endpoint if no API key (great for dev/testing)
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
                const response = await axios_1.default.get(url, { timeout: 10000 });
                if (response.data && response.data[0]) {
                    // The response is a nested array, we need to map and join the translated sentences
                    return response.data[0].map((item) => item[0]).join('');
                }
            }
            throw new Error('Invalid response format');
        }
        catch (error) {
            throw new appError_1.AppError(`Google Translate failed: ${error.message}`, 502);
        }
    }
}
exports.GoogleTranslateProvider = GoogleTranslateProvider;
