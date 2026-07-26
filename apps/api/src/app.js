import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import routes from './routes/index.js';
import {
  helmetMiddleware,
  corsMiddleware,
  sanitizeMiddleware,
  hppMiddleware,
  generalLimiter
} from './middleware/security.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // A specific hop count, not `true`. Trusting every proxy would let a client
  // set X-Forwarded-For themselves and walk straight past per-IP rate limiting.
  app.set('trust proxy', env.TRUST_PROXY_HOPS);
  app.disable('x-powered-by');

  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(compression());
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));

  // 100kb is far more than any legitimate request here needs. An unbounded
  // body parser is a free denial-of-service.
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());

  app.use(sanitizeMiddleware);
  app.use(hppMiddleware);
  app.use(generalLimiter);

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
