import { Request, Response, NextFunction } from 'express';
import { sitemapGenerator } from '@/seo/generators/SitemapGenerator';
import { robotsGenerator } from '@/seo/generators/RobotsGenerator';

class SEOController {
  public getRobotsTxt = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const robots = robotsGenerator.generate();
      res.header('Content-Type', 'text/plain');
      return res.send(robots);
    } catch (error) {
      next(error);
    }
  };

  public getSitemapIndex = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const xml = sitemapGenerator.generateIndex();
      res.header('Content-Type', 'application/xml');
      return res.send(xml);
    } catch (error) {
      next(error);
    }
  };

  public getBhajansSitemap = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const xml = await sitemapGenerator.generateBhajansSitemap();
      res.header('Content-Type', 'application/xml');
      return res.send(xml);
    } catch (error) {
      next(error);
    }
  };
}

export const seoController = new SEOController();
