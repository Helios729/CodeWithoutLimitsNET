import pino from 'pino';
import { env } from '../config/env.js';

/**
 * Redaction list. Anything that could carry a credential or a learner's
 * personal data is stripped before it reaches the log transport, because
 * Railway log drains are a separate trust boundary from the database.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'req.body.password',
      'req.body.currentPassword',
      'req.body.newPassword',
      'req.body.refreshToken',
      'req.body.email',
      '*.password',
      '*.passwordHash'
    ],
    censor: '[redacted]'
  },
  transport: env.isProduction ? undefined : { target: 'pino/file', options: { destination: 1 } }
});
