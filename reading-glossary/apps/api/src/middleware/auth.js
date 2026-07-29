import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { unauthorized, forbidden } from '../lib/errors.js';

function readBearer(req) {
  const header = req.get('authorization') || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

async function resolveUser(token) {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: ['HS256'],
    issuer: 'codewithoutlimits.net',
    audience: 'cwl-clients'
  });

  const user = await User.findOne({ _id: payload.sub, deletedAt: null });
  if (!user) throw unauthorized('Session is no longer valid.');

  // tokenVersion is the revocation lever: a password change or a "sign out
  // everywhere" bumps it and every token minted before that point stops working.
  if (payload.tv !== user.tokenVersion) throw unauthorized('Session has expired. Sign in again.');

  return user;
}

/** Hard requirement: no valid access token means no access. */
export async function requireAuth(req, _res, next) {
  try {
    const token = readBearer(req);
    if (!token) throw unauthorized();
    req.user = await resolveUser(token);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(unauthorized('Session expired.'));
    if (err.name === 'JsonWebTokenError') return next(unauthorized('Invalid session.'));
    next(err);
  }
}

/**
 * Attaches the user when a token is present and valid, but does not fail when
 * one is absent. Used by demo-mode routes so an anonymous visitor gets the
 * preview slice and a signed-in learner gets the whole module from the same URL.
 */
export async function optionalAuth(req, _res, next) {
  const token = readBearer(req);
  if (!token) return next();
  try {
    req.user = await resolveUser(token);
  } catch {
    req.user = undefined;
  }
  next();
}

export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden('This action requires elevated access.'));
    next();
  };
