"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deityRoutes = exports.deityController = exports.deityService = exports.deityRepository = void 0;
var DeityRepository_1 = require("./DeityRepository");
Object.defineProperty(exports, "deityRepository", { enumerable: true, get: function () { return DeityRepository_1.deityRepository; } });
var DeityService_1 = require("./DeityService");
Object.defineProperty(exports, "deityService", { enumerable: true, get: function () { return DeityService_1.deityService; } });
var DeityController_1 = require("./DeityController");
Object.defineProperty(exports, "deityController", { enumerable: true, get: function () { return DeityController_1.deityController; } });
var DeityRoutes_1 = require("./DeityRoutes");
Object.defineProperty(exports, "deityRoutes", { enumerable: true, get: function () { return __importDefault(DeityRoutes_1).default; } });
