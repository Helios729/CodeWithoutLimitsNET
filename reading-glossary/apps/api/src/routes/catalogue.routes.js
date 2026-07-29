import { Router } from 'express';
import { Module } from '../models/Module.js';
import { Progress } from '../models/Progress.js';
import { optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { catalogueQuerySchema } from '../schemas/api.schema.js';

const router = Router();

/**
 * Public catalogue. Anonymous visitors get the cards; a signed-in learner gets
 * the same cards with their own progress merged in, so the marketing page and
 * the dashboard can share one endpoint and one cache key shape.
 */
router.get('/', optionalAuth, validate({ query: catalogueQuerySchema }), async (req, res, next) => {
  try {
    const { difficulty, q, page, limit } = req.validatedQuery;

    const filter = { published: true };
    if (difficulty) filter.difficulty = difficulty;
    if (q) filter.$text = { $search: q };

    const [modules, total] = await Promise.all([
      Module.find(filter)
        .sort(q ? { score: { $meta: 'textScore' } } : { order: 1, module_title: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Module.countDocuments(filter)
    ]);

    const cards = modules.map((m) => m.toCardJSON());

    if (req.user) {
      const progress = await Progress.find({
        user: req.user._id,
        module_id: { $in: cards.map((c) => c.module_id) }
      });
      const byModule = new Map(progress.map((p) => [p.module_id, p]));
      for (const card of cards) {
        const p = byModule.get(card.module_id);
        card.progress = p
          ? {
              status: p.status,
              completedMiniLessons: p.completedMiniLessons.length,
              bestModuleScorePct: p.bestModuleScorePct
            }
          : { status: 'not_started', completedMiniLessons: 0, bestModuleScorePct: null };
      }
    }

    res.set('Cache-Control', req.user ? 'private, no-store' : 'public, max-age=300');
    res.json({ modules: cards, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

export default router;
