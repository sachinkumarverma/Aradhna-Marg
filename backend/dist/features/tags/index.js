"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagRoutes = exports.tagController = exports.tagService = exports.tagRepository = void 0;
var TagRepository_1 = require("./TagRepository");
Object.defineProperty(exports, "tagRepository", { enumerable: true, get: function () { return TagRepository_1.tagRepository; } });
var TagService_1 = require("./TagService");
Object.defineProperty(exports, "tagService", { enumerable: true, get: function () { return TagService_1.tagService; } });
var TagController_1 = require("./TagController");
Object.defineProperty(exports, "tagController", { enumerable: true, get: function () { return TagController_1.tagController; } });
var TagRoutes_1 = require("./TagRoutes");
Object.defineProperty(exports, "tagRoutes", { enumerable: true, get: function () { return __importDefault(TagRoutes_1).default; } });
