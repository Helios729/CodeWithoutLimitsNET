import crypto from 'node:crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { AuditLog } from '../models/AuditLog.js';
import { hashIp } from '../middleware/security.js';
import { unauthorized } from '../lib/errors.js';

/**
 * Argon2id parameters. 19 MiB and 2 passes is the OWASP baseline; it is a
 * deliberate choice over bcrypt because Argon2id resists GPU and ASIC attack
 * far better, and the memory cost is affordable on a Railway container.
 */
const ARGON_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1
};

export const hashPassword = (plain) => argon2.hash(plain, ARGON_OPTIONS);

export async function verifyPassword(hash, plain) {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

/**
 * Constant-ish-time decoy. When an email does not exist we still burn a
 * comparable amount of CPU, so response timing does not reveal which addresses
 * are registered.
 */
const DECOY_HASH = await argon2.hash(crypto.randomBytes(32).toString('hex'), ARGON_OPTIONS);
export const burnTiming = () => argon2.verify(DECOY_HASH, 'never-matches').catch(() => false);

export function signAccessToken(user) {
  return jwt.sign(
    { role: user.role, tv: user.tokenVersion },
    env.JWT_ACCESS_SECRET,
    {
      algorithm: 'HS256',
      subject: user._id.toString(),
      expiresIn: env.JWT_ACCESS_TTL,
      issuer: 'codewithoutlimits.net',
      audience: 'cwl-clients'
    }
  );
}

const digest = (token) => crypto.createHash('sha256').update(token).digest('hex');

const ttlToMs = (ttl) => {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const units = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return Number(match[1]) * units[match[2]];
};

export async function issueRefreshToken(user, req, family = crypto.randomUUID()) {
  const token = crypto.randomBytes(48).toString('base64url');
  await RefreshToken.create({
    user: user._id,
    tokenHash: digest(token),
    family,
    userAgent: (req.get('user-agent') || '').slice(0, 300),
    ipHash: hashIp(req.ip),
    expiresAt: new Date(Date.now() + ttlToMs(env.JWT_REFRESH_TTL))
  });
  return { token, family };
}

/**
 * Rotation with reuse detection. Presenting a token that has already been
 * exchanged means two parties hold it; the safe assumption is theft, so the
 * entire family is revoked and the learner is asked to sign in again.
 */
export async function rotateRefreshToken(presented, req) {
  const record = await RefreshToken.findOne({ tokenHash: digest(presented) });
  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw unauthorized('Session is no longer valid. Sign in again.');
  }

  if (record.usedAt) {
    await RefreshToken.updateMany(
      { family: record.family, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    await AuditLog.create({
      action: 'auth.refresh.reuse_detected',
      user: record.user,
      ipHash: hashIp(req.ip),
      userAgent: (req.get('user-agent') || '').slice(0, 300),
      meta: { family: record.family }
    });
    throw unauthorized('Session ended for your security. Sign in again.');
  }

  return record;
}

export async function revokeFamily(family) {
  await RefreshToken.updateMany({ family, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    // 'strict' would break the sign-in redirect back from the marketing site;
    // 'lax' still blocks the cross-site POST that CSRF depends on.
    sameSite: env.isProduction ? 'lax' : 'lax',
    path: '/api/auth',
    domain: env.isProduction && env.COOKIE_DOMAIN ? env.COOKIE_DOMAIN : undefined,
    maxAge: ttlToMs(env.JWT_REFRESH_TTL)
  };
}

export { digest as hashRefreshToken };
