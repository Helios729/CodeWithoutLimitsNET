import { Router } from 'express';
import { Module } from '../models/Module.js';
import { Progress } from '../models/Progress.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { moduleIdParam, lessonProgressSchema } from '../schemas/api.schema.js';
import { env } from '../config/env.js';
import { notFound } from '../lib/errors.js';

const router = Router();

/**
 * Module detail. In demo mode an anonymous visitor receives mini-lesson 1 in
 * full and the remaining lessons as titles only, which is enough to judge the
 * teaching quality without giving the whole module away.
 */
router.get('/:moduleId', optionalAuth, validate({ params: moduleIdParam }), async (req, res, next) => {
  try {
    const mod = await Module.findOne({ module_id: req.params.moduleId, published: true });
    if (!mod) throw notFound('That module is not available.');

    const isDemo = !req.user && env.demoModeEnabled;
    const payload = mod.toObject();

    if (isDemo) {
      payload.mini_lessons = payload.mini_lessons.map((lesson, index) =>
        index === 0
          ? lesson
          : { ml: lesson.ml, title: lesson.title, bloom: lesson.bloom, concepts: [], locked: true }
      );
      payload.demo = { active: true, unlockedMiniLessons: 1, message: 'Create a free account to open the full module.' };
    }

    if (req.user) {
      const progress = await Progress.findOne({ user: req.user._id, module_id: mod.module_id });
      payload.progress = progress ?? {
        status: 'not_started',
        completedMiniLessons: [],
        completedMiniQuizzes: []
      };
      await Progress.updateOne(
        { user: req.user._id, module_id: mod.module_id },
        { $set: { lastAccessedAt: new Date() }, $setOnInsert: { startedAt: new Date(), status: 'in_progress' } },
        { upsert: true }
      );
    }

    res.set('Cache-Control', req.user ? 'private, no-store' : 'public, max-age=300');
    res.json({ module: payload });
  } catch (err) {
    next(err);
  }
});

/** Marks a mini-lesson read. Idempotent, so a double-tap does not double-count. */
router.post(
  '/:moduleId/lessons/complete',
  requireAuth,
  validate({ params: moduleIdParam, body: lessonProgressSchema }),
  async (req, res, next) => {
    try {
      const mod = await Module.findOne({ module_id: req.params.moduleId, published: true });
      if (!mod) throw notFound('That module is not available.');

      const exists = mod.mini_lessons.some((l) => l.ml === req.body.miniLesson);
      if (!exists) throw notFound(`Mini-lesson ${req.body.miniLesson} does not exist in this module.`);

      const progress = await Progress.findOneAndUpdate(
        { user: req.user._id, module_id: mod.module_id },
        {
          $addToSet: { completedMiniLessons: req.body.miniLesson },
          $set: { lastAccessedAt: new Date(), status: 'in_progress' },
          $setOnInsert: { startedAt: new Date() }
        },
        { upsert: true, new: true }
      );

      res.json({
        progress: {
          module_id: progress.module_id,
          completedMiniLessons: progress.completedMiniLessons.sort((a, b) => a - b),
          totalMiniLessons: mod.mini_lessons.length,
          status: progress.status
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
