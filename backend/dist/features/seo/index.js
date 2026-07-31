"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seoRoutes = exports.seoController = exports.seoService = exports.seoRepository = void 0;
var SeoRepository_1 = require("./SeoRepository");
Object.defineProperty(exports, "seoRepository", { enumerable: true, get: function () { return SeoRepository_1.seoRepository; } });
var SeoService_1 = require("./SeoService");
Object.defineProperty(exports, "seoService", { enumerable: true, get: function () { return SeoService_1.seoService; } });
var SeoController_1 = require("./SeoController");
Object.defineProperty(exports, "seoController", { enumerable: true, get: function () { return SeoController_1.seoController; } });
var SeoRoutes_1 = require("./SeoRoutes");
Object.defineProperty(exports, "seoRoutes", { enumerable: true, get: function () { return __importDefault(SeoRoutes_1).default; } });
