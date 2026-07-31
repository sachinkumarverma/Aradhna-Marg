import pino from 'pino';
import { config } from '@/config';
import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const targets: any[] = [];

if (config.NODE_ENV === 'development') {
  targets.push({
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  });
} else {
  targets.push({
    target: 'pino/file',
    options: {
      destination: path.join(logDir, 'app.log'),
      mkdir: true,
    },
  });
}

export const logger = pino({
  level: config.NODE_ENV === 'development' ? 'debug' : 'info',
  transport: {
    targets,
  },
});
