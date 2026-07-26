"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seoController = void 0;
const SitemapGenerator_1 = require("../generators/SitemapGenerator");
const RobotsGenerator_1 = require("../generators/RobotsGenerator");
class SEOController {
    getRobotsTxt = async (req, res, next) => {
        try {
            const robots = RobotsGenerator_1.robotsGenerator.generate();
            res.header('Content-Type', 'text/plain');
            return res.send(robots);
        }
        catch (error) {
            next(error);
        }
    };
    getSitemapIndex = async (req, res, next) => {
        try {
            const xml = SitemapGenerator_1.sitemapGenerator.generateIndex();
            res.header('Content-Type', 'application/xml');
            return res.send(xml);
        }
        catch (error) {
            next(error);
        }
    };
    getBhajansSitemap = async (req, res, next) => {
        try {
            const xml = await SitemapGenerator_1.sitemapGenerator.generateBhajansSitemap();
            res.header('Content-Type', 'application/xml');
            return res.send(xml);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.seoController = new SEOController();
