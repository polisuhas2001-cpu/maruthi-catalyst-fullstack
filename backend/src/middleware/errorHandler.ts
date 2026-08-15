import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, message: 'Not found.' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    if (err.status >= 500) {
      logger.error(err.message, { path: req.path, stack: err.stack });
    }
    res.status(err.status).json({
      success: false,
      message: err.message,
      ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
    });
    return;
  }

  const error = err instanceof Error ? err : new Error('Unknown error');
  logger.error('Unhandled error', { path: req.path, message: error.message, stack: error.stack });

  // Never leak stack traces, driver errors, or internal messages to clients.
  res.status(500).json({
    success: false,
    message: 'Something went wrong on our end. Please try again in a few minutes.',
  });
}
