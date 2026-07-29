/**
 * Environment loading and validation.
 *
 * The process refuses to start if a required secret is missing or is still set
 * to its placeholder value. Failing loudly at boot is much safer than starting
 * an API that silently signs tokens with "replace-me".
 */
import 'dotenv/config';
import { z } from 'zod';

const PLACEHOLDER = /replace-me/i;

const notPlaceholder = (label) =>
  z.string().min(32, `${label} must be at least 32 characters`).refine(
    (v) => !PLACEHOLDER.test(v),
    `${label} is still set to the .env.example placeholder`
  );

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1),
  MONGODB_DB_NAME: z.string().default('codewithoutlimits'),
  JWT_ACCESS_SECRET: notPlaceholder('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: notPlaceholder('JWT_REFRESH_SECRET'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  COOKIE_DOMAIN: z.string().optional(),
  PUBLIC_WEB_URL: z.string().url().default('https://codewithoutlimits.net'),
  CONTENT_DIR: z.string().default('../../content'),
  DEMO_MODE_ENABLED: z.enum(['true', 'false']).default('true'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(1),
  LOG_LEVEL: z.string().default('info')
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const detail = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`Configuration is invalid, refusing to start:\n${detail}`);
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  demoModeEnabled: raw.DEMO_MODE_ENABLED === 'true',
  corsOrigins: raw.CORS_ORIGINS.split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean)
};

// A wildcard origin combined with credentialed cookies is the single most
// common way an otherwise sound API leaks sessions. Refuse it outright.
if (env.isProduction && env.corsOrigins.includes('*')) {
  // eslint-disable-next-line no-console
  console.error('CORS_ORIGINS may not contain "*" in production.');
  process.exit(1);
}

export default env;
