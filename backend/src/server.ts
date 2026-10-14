import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { db } from './common/database/DatabaseClient';

const PORT = parseInt(config.PORT, 10);

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server is running on http://localhost:${PORT} in ${config.NODE_ENV} mode.`);
  // Asynchronously pre-warm the database pool so the first HTTP request incurs 0ms connection latency
  db.warmup().catch((err) => {
    logger.warn({ err }, 'Database pre-warm failed, will connect on-demand');
  });
});

// Graceful Shutdown
const gracefulShutdown = () => {
  logger.info('Received shutdown signal. Closing HTTP server and database pool...');
  db.close().catch(() => {});
  server.close(() => {
    logger.info('HTTP server closed. Process will exit now.');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (err) => {
  console.error('RAW UNCAUGHT EXCEPTION:', err);
  logger.error({ err }, 'Uncaught Exception');
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('RAW UNHANDLED REJECTION:', reason);
  logger.error({ reason }, 'Unhandled Rejection at promise');
  gracefulShutdown();
});
