/**
 * Reusable Logger Utility for Frontend
 * Supports different log levels and environment-based logging
 */

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  SUCCESS: 2,
  WARNING: 3,
  ERROR: 4
} as const;

type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

const envLogLevel = import.meta.env.PROD ? LogLevel.INFO : LogLevel.DEBUG;

const log = (level: LogLevel, prefix: string, message: string, meta?: any) => {
  if (level < envLogLevel) return;

  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${prefix}] ${message}`;

  switch (level) {
    case LogLevel.DEBUG:
      console.debug(`%c${logMessage}`, 'color: #3b82f6', meta ? meta : ''); // Blue
      break;
    case LogLevel.INFO:
      console.info(`%c${logMessage}`, 'color: #06b6d4', meta ? meta : ''); // Cyan
      break;
    case LogLevel.SUCCESS:
      console.log(`%c${logMessage}`, 'color: #22c55e', meta ? meta : ''); // Green
      break;
    case LogLevel.WARNING:
      console.warn(`%c${logMessage}`, 'color: #f59e0b', meta ? meta : ''); // Yellow
      break;
    case LogLevel.ERROR:
      console.error(`%c${logMessage}`, 'color: #ef4444', meta ? meta : ''); // Red
      break;
  }
};

export const logger = {
  debug: (message: string, meta?: any) => log(LogLevel.DEBUG, 'DEBUG', message, meta),
  info: (message: string, meta?: any) => log(LogLevel.INFO, 'INFO', message, meta),
  success: (message: string, meta?: any) => log(LogLevel.SUCCESS, 'SUCCESS', message, meta),
  warn: (message: string, meta?: any) => log(LogLevel.WARNING, 'WARN', message, meta),
  error: (message: string, error?: any) => log(LogLevel.ERROR, 'ERROR', message, error)
};
