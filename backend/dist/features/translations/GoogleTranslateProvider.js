"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleTranslateProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const appError_1 = require("../../errors/appError");
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
                // Fallback to free GTX endpoint if no API key
                if (format === 'html') {
                    return await this.translateHtmlFree(text, sourceLang, targetLang);
                }
                else {
                    return await this.translateTextFree(text, sourceLang, targetLang);
                }
            }
            throw new Error('Invalid response format');
        }
        catch (error) {
            throw new appError_1.AppError(`Google Translate failed: ${error.message}`, 502);
        }
    }
    async translateTextFree(text, sourceLang, targetLang) {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t`;
        const MAX_CHUNK_LENGTH = 4000;
        const chunks = [];
        let i = 0;
        while (i < text.length) {
            let end = i + MAX_CHUNK_LENGTH;
            if (end < text.length) {
                const delimIndex = text.lastIndexOf('[###]', end);
                if (delimIndex > i) {
                    end = delimIndex + 5;
                }
                else {
                    const spaceIndex = text.lastIndexOf(' ', end);
                    if (spaceIndex > i)
                        end = spaceIndex;
                }
            }
            chunks.push(text.slice(i, end));
            i = end;
        }
        let finalTranslatedText = '';
        for (const chunk of chunks) {
            const data = new URLSearchParams();
            data.append('q', chunk);
            const response = await axios_1.default.post(url, data, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 10000
            });
            if (response.data && response.data[0]) {
                finalTranslatedText += response.data[0].map((item) => item[0]).join('');
            }
            else {
                throw new Error('Invalid response format from GTX API');
            }
        }
        return finalTranslatedText;
    }
    async translateHtmlFree(html, sourceLang, targetLang) {
        // Parse the HTML using Cheerio
        const $ = cheerio.load(html, null, false);
        const textNodes = [];
        // Recursively find text nodes that contain actual text
        function extractText(node) {
            if (node.type === 'text') {
                const text = node.data.trim();
                if (text.length > 0) {
                    textNodes.push(node);
                }
            }
            else if (node.type === 'tag' && node.children) {
                node.children.forEach(extractText);
            }
        }
        $.root().children().each((_, el) => extractText(el));
        if (textNodes.length === 0) {
            return html;
        }
        const texts = textNodes.map(n => n.data);
        const DELIMITER = ' \n\n[###]\n\n ';
        const combinedText = texts.join(DELIMITER);
        const translatedText = await this.translateTextFree(combinedText, sourceLang, targetLang);
        const translatedParts = translatedText.split(/\s*\[###\]\s*/);
        // Reconstruct the HTML
        for (let i = 0; i < Math.min(textNodes.length, translatedParts.length); i++) {
            textNodes[i].data = translatedParts[i] || textNodes[i].data;
        }
        return $.html();
    }
}
exports.GoogleTranslateProvider = GoogleTranslateProvider;
