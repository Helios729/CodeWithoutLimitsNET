import { Router } from 'express';
import { Progress } from '../models/Progress.js';
import { Attempt } from '../models/Attempt.js';
import { Module } from '../models/Module.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { PASS_THRESHOLD_PCT } from '../services/grading.service.js';

const router = Router();

/** The learner's own dashboard. */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const [progress, modules, recentAttempts] = await Promise.all([
      Progress.find({ user: req.user._id }).sort({ lastAccessedAt: -1 }),
      Module.find({ published: true }).select('module_id module_title difficulty duration_min mini_lessons'),
      Attempt.find({ user: req.user._id, status: 'submitted' }).sort({ submittedAt: -1 }).limit(10)
    ]);

    const moduleIndex = new Map(modules.map((m) => [m.module_id, m]));

    const rows = progress.map((p) => {
      const mod = moduleIndex.get(p.module_id);
      const totalLessons = mod?.mini_lessons.length ?? 0;
      return {
        module_id: p.module_id,
        module_title: mod?.module_title ?? p.module_id,
        difficulty: mod?.difficulty ?? null,
        status: p.status,
        completedMiniLessons: p.completedMiniLessons.length,
        totalMiniLessons: totalLessons,
        percentComplete: totalLessons ? Math.round((p.completedMiniLessons.length / totalLessons) * 100) : 0,
        bestModuleScorePct: p.bestModuleScorePct,
        attemptCount: p.attemptCount,
        lastAccessedAt: p.lastAccessedAt
      };
    });

    // Aggregate Bloom mastery across every module, which is the number a
    // facilitator actually acts on when planning the next session.
    const mastery = {};
    for (const p of progress) {
      for (const [level, counts] of p.bloomMastery) {
        mastery[level] ??= { correct: 0, total: 0 };
        mastery[level].correct += counts.correct;
        mastery[level].total += counts.total;
      }
    }
    for (const level of Object.keys(mastery)) {
      mastery[level].percentage = mastery[level].total
        ? Math.round((mastery[level].correct / mastery[level].total) * 100)
        : 0;
    }

    res.set('Cache-Control', 'private, no-store');
    res.json({
      summary: {
        modulesStarted: rows.length,
        modulesCompleted: rows.filter((r) => r.status === 'completed').length,
        modulesAvailable: modules.length,
        passThresholdPct: PASS_THRESHOLD_PCT,
        bloomMastery: mastery
      },
      modules: rows,
      recentAttempts: recentAttempts.map((a) => ({
        id: a._id.toString(),
        module_id: a.module_id,
        scope: a.scope,
        percentage: a.percentage,
        passed: a.passed,
        submittedAt: a.submittedAt
      }))
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Cohort roll-up for facilitators. Returns counts and averages only, never a
 * per-learner answer trail, so classroom reporting does not become surveillance.
 */
router.get('/cohort/:cohort', requireAuth, requireRole('facilitator', 'admin'), async (req, res, next) => {
  try {
    const cohort = String(req.params.cohort).slice(0, 64);

    const rows = await Progress.aggregate([
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'learner' } },
      { $unwind: '$learner' },
      { $match: { 'learner.cohort': cohort, 'learner.deletedAt': null } },
      {
        $group: {
          _id: '$module_id',
          learners: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          averageBestScore: { $avg: '$bestModuleScorePct' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.set('Cache-Control', 'private, no-store');
    res.json({
      cohort,
      modules: rows.map((r) => ({
        module_id: r._id,
        learners: r.learners,
        completed: r.completed,
        completionRate: Math.round((r.completed / r.learners) * 100),
        averageBestScore: r.averageBestScore === null ? null : Math.round(r.averageBestScore * 10) / 10
      }))
    });
  } catch (err) {
    next(err);
  }
});

export default router;
