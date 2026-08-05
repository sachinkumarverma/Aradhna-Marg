import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { securityMiddleware } from './config/security';
import compression from 'compression';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';

import routes from './routes';
import seoRoutes from './seo/routes/seo.routes';
import { globalErrorHandler, notFoundHandler } from './middlewares/error';
import { base64UploadMiddleware } from './middlewares/base64Upload.middleware';
import { logger } from './utils/logger';

const app: Application = express();

// Add Request ID generator middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv4();
  res.setHeader('x-request-id', req.headers['x-request-id']);
  next();
});

// Security & Standard Middlewares
app.use(securityMiddleware);
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Base64 Image Upload Middleware
app.use(base64UploadMiddleware);

// Global String Trimming Middleware
const trimStrings = (obj: any): any => {
  if (typeof obj === 'string') return obj.trim();
  if (obj !== null && typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      obj[key] = trimStrings(obj[key]);
    });
  }
  return obj;
};

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.body) trimStrings(req.body);
  if (req.query) trimStrings(req.query);
  if (req.params) trimStrings(req.params);
  next();
});

// Logging Middleware
app.use(
  morgan((tokens, req, res) => {
    return [
      `[${tokens.date(req, res, 'iso')}]`,
      tokens['remote-addr'](req, res),
      `ID:${req.headers['x-request-id']}`,
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      `${tokens['response-time'](req, res)}ms`,
    ].join(' ');
  }, {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// Public SEO Files (robots.txt, sitemap.xml)
app.use('/', seoRoutes);

// Serve locally uploaded media files
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// API Routes Entry Point
app.use('/api', routes);

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
