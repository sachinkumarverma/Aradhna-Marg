"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const search_controller_1 = require("@/search/controllers/search.controller");
const router = (0, express_1.Router)();
router.get('/', search_controller_1.searchController.search);
router.get('/suggestions', search_controller_1.searchController.getSuggestions);
router.get('/trending', search_controller_1.searchController.getTrending);
exports.default = router;
