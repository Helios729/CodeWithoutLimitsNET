import crypto from 'node:crypto';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { forbidden, tooMany } from '../lib/errors.js';

/**
 * Content Security Policy for the API surface itself. The API returns JSON, so
 * the policy is deliberately close to "deny everything": there is no legitimate
 * reason for a script, frame or image to load from an API response.
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"]
    }
  },
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'no-referrer' },
  hsts: env.isProduction
    ? { maxAge: 63_072_000, includeSubDomains: true, preload: true }
    : false,
  // The API never serves HTML, so this header adds nothing but does no harm
  // if a future route returns a document.
  xFrameOptions: { action: 'deny' }
});

/**
 * Strict origin allowlist. `origin` is undefined for same-origin and non-browser
 * callers (curl, the Expo runtime, server-to-server), which are allowed; a
 * browser origin that is not on the list is rejected rather than silently
 * echoed back.
 */
export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const normalised = origin.replace(/\/$/, '');
    if (env.corsOrigins.includes(normalised)) return callback(null, true);
    return callback(forbidden(`Origin ${origin} is not permitted.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CWL-Client'],
  exposedHeaders: ['RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 600
});

/** Strips keys beginning with `$` or containing `.` from body, query and params. */
export const sanitizeMiddleware = mongoSanitize({
  replaceWith: '_',
  allowDots: false
});

/** Collapses duplicated query parameters, which otherwise arrive as arrays. */
export const hppMiddleware = hpp();

export const hashIp = (ip) =>
  crypto.createHash('sha256').update(`${ip || 'unknown'}:${env.JWT_ACCESS_SECRET}`).digest('hex').slice(0, 32);

const limiterDefaults = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, next) => next(tooMany())
};

/** Broad ceiling on every route. Generous, so ordinary study sessions are unaffected. */
export const generalLimiter = rateLimit({
  ...limiterDefaults,
  windowMs: 15 * 60 * 1000,
  limit: 600
});

/**
 * Tight limit on credential endpoints, keyed on IP plus the submitted email so
 * that a single shared classroom NAT address does not lock out a whole cohort
 * while a distributed attempt against one account is still caught.
 */
export const authLimiter = rateLimit({
  ...limiterDefaults,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${req.ip}:${String(req.body?.email || '').toLowerCase()}`
});

/** Attempt creation is cheap for a client and costly for the database. */
export const attemptLimiter = rateLimit({
  ...limiterDefaults,
  windowMs: 60 * 1000,
  limit: 20
});
