"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityMiddleware = void 0;
const helmet_1 = __importDefault(require("helmet"));
exports.securityMiddleware = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"], // Add analytics/tag managers here
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https://i.ytimg.com", "https://images.unsplash.com"],
            connectSrc: ["'self'", "https://www.google-analytics.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com"],
        },
    },
    crossOriginEmbedderPolicy: false, // Often blocks YouTube iframes if true
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allows images from other origins
    dnsPrefetchControl: { allow: true },
    frameguard: { action: 'deny' }, // Prevent clickjacking
    hidePoweredBy: true, // Hide Express
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
});
