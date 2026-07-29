import { Router } from 'express';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { AuditLog } from '../models/AuditLog.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter, hashIp } from '../middleware/security.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema
} from '../schemas/api.schema.js';
import {
  hashPassword,
  verifyPassword,
  burnTiming,
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeFamily,
  refreshCookieOptions
} from '../services/auth.service.js';
import { unauthorized, conflict, badRequest } from '../lib/errors.js';

const router = Router();

const MAX_FAILED_LOGINS = 8;
const LOCK_MINUTES = 15;

const audit = (action, req, user, meta = {}) =>
  AuditLog.create({
    action,
    user: user?._id ?? null,
    ipHash: hashIp(req.ip),
    userAgent: (req.get('user-agent') || '').slice(0, 300),
    meta
  }).catch(() => {});

router.post('/register', authLimiter, validate({ body: registerSchema }), async (req, res, next) => {
  try {
    const { email, password, displayName, cohort, preferredLanguage } = req.body;

    const existing = await User.findOne({ email });
    if (existing) throw conflict('That email is already registered. Try signing in.');

    const user = await User.create({
      email,
      passwordHash: await hashPassword(password),
      displayName,
      cohort: cohort || null,
      preferredLanguage
    });

    const { token: refreshToken } = await issueRefreshToken(user, req);
    await audit('auth.register', req, user);

    res
      .cookie('cwl_rt', refreshToken, refreshCookieOptions())
      .status(201)
      .json({ user: user.toPublicJSON(), accessToken: signAccessToken(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', authLimiter, validate({ body: loginSchema }), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, deletedAt: null }).select('+passwordHash');

    if (!user) {
      // Same work, same shape of response as a wrong password, so the endpoint
      // cannot be used to find out which addresses have accounts.
      await burnTiming();
      throw unauthorized('That email and password combination did not match.');
    }

    if (user.isLocked()) {
      await audit('auth.login.locked', req, user);
      throw unauthorized(`Too many attempts. Try again in ${LOCK_MINUTES} minutes.`);
    }

    const ok = await verifyPassword(user.passwordHash, password);
    if (!ok) {
      user.failedLoginCount += 1;
      if (user.failedLoginCount >= MAX_FAILED_LOGINS) {
        user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60_000);
        user.failedLoginCount = 0;
      }
      await user.save();
      await audit('auth.login.failure', req, user);
      throw unauthorized('That email and password combination did not match.');
    }

    user.failedLoginCount = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    const { token: refreshToken } = await issueRefreshToken(user, req);
    await audit('auth.login.success', req, user);

    res
      .cookie('cwl_rt', refreshToken, refreshCookieOptions())
      .json({ user: user.toPublicJSON(), accessToken: signAccessToken(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    // Cookie first for the browser; body fallback for the Expo app, which has
    // no cookie jar and keeps the token in the device secure store instead.
    const presented = req.cookies?.cwl_rt || req.body?.refreshToken;
    if (!presented) throw unauthorized('No session to refresh.');

    const record = await rotateRefreshToken(presented, req);
    const user = await User.findOne({ _id: record.user, deletedAt: null });
    if (!user) throw unauthorized('Session is no longer valid.');

    const { token: next } = await issueRefreshToken(user, req, record.family);
    record.usedAt = new Date();
    record.replacedBy = next.slice(0, 12);
    await record.save();

    res
      .cookie('cwl_rt', next, refreshCookieOptions())
      .json({ accessToken: signAccessToken(user), user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const presented = req.cookies?.cwl_rt || req.body?.refreshToken;
    if (presented) {
      const record = await RefreshToken.findOne({
        tokenHash: (await import('node:crypto')).createHash('sha256').update(presented).digest('hex')
      });
      if (record) await revokeFamily(record.family);
    }
    res.clearCookie('cwl_rt', { ...refreshCookieOptions(), maxAge: undefined });
    await audit('auth.logout', req, req.user);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
});

router.patch('/me', requireAuth, validate({ body: updateProfileSchema }), async (req, res, next) => {
  try {
    Object.assign(req.user, req.body);
    await req.user.save();
    res.json({ user: req.user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/change-password',
  requireAuth,
  authLimiter,
  validate({ body: changePasswordSchema }),
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).select('+passwordHash');
      const ok = await verifyPassword(user.passwordHash, req.body.currentPassword);
      if (!ok) throw unauthorized('Current password is incorrect.');
      if (req.body.currentPassword === req.body.newPassword) {
        throw badRequest('Choose a password you have not used here before.');
      }

      user.passwordHash = await hashPassword(req.body.newPassword);
      // Invalidates every outstanding access token for this account.
      user.tokenVersion += 1;
      await user.save();

      await RefreshToken.updateMany(
        { user: user._id, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
      await audit('auth.password.change', req, user);

      res.clearCookie('cwl_rt', { ...refreshCookieOptions(), maxAge: undefined });
      res.json({ ok: true, message: 'Password changed. Sign in again on your other devices.' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
