import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/errors/appError';
import { sendError } from '@/responses/apiResponse';
import { logger } from '@utils/logger';
import { config } from '@/config';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  if (!error.isOperational) {
    logger.error({ stack: err.stack, path: req.path }, `[UNHANDLED ERROR] ${err.message}`);
  } else {
    logger.warn(`[OPERATIONAL ERROR] ${err.message}`);
  }

  // Handle specific database or known library errors here if needed
  // ...

  // Operational, trusted error: send message to client
  if (err instanceof AppError) {
    return sendError(res, err.message, err.errors, err.statusCode);
  }

  // Programming or other unknown error: don't leak error details in production
  const message = config.NODE_ENV === 'production' ? 'Something went wrong!' : err.message;
  return sendError(res, message, config.NODE_ENV === 'production' ? undefined : err.stack, 500);
};

// Catch-all for 404
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};
