import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';

export function notFoundHandler(req, _res, next) {
  next(new AppError(404, 'not_found', `No route for ${req.method} ${req.path}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    logger.error({ err, path: req.path, method: req.method }, 'unhandled error');
  } else {
    logger.warn({ code: err.code, path: req.path, status }, err.message);
  }

  // Mongo duplicate key. Reported without naming the conflicting value, so the
  // registration endpoint cannot be used to enumerate which emails exist.
  if (err.code === 11000) {
    return res.status(409).json({
      error: { code: 'conflict', message: 'That record already exists.' }
    });
  }

  const clientSafe = err instanceof AppError || err.expose === true;

  res.status(status).json({
    error: {
      code: err.code || (status >= 500 ? 'internal_error' : 'request_error'),
      message: clientSafe ? err.message : 'Something went wrong on our side. Please try again.',
      ...(clientSafe && err.details ? { details: err.details } : {}),
      ...(env.isProduction || !err.stack ? {} : { stack: err.stack.split('\n').slice(0, 6) })
    }
  });
}
