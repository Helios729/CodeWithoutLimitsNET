import { Router } from 'express';
import { Attempt } from '../models/Attempt.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { attemptLimiter } from '../middleware/security.js';
import {
  moduleIdParam,
  startAttemptSchema,
  submitAttemptSchema,
  attemptIdParam
} from '../schemas/api.schema.js';
import { selectQuestions, toLearnerQuestions } from '../services/superquiz.service.js';
import {
  loadAnswerKey,
  gradeResponses,
  buildFeedback,
  applyProgress,
  PASS_THRESHOLD_PCT
} from '../services/grading.service.js';
import { env } from '../config/env.js';
import { forbidden, notFound, badRequest } from '../lib/errors.js';

const router = Router();

const ATTEMPT_TTL_MINUTES = 120;

/**
 * Preview a quiz without starting an attempt. Returns structure and counts
 * only - no stems - so the module page can show what the assessment covers.
 */
router.get('/:moduleId/outline', optionalAuth, validate({ params: moduleIdParam }), async (req, res, next) => {
  try {
    const { quiz } = await selectQuestions({ moduleId: req.params.moduleId, scope: 'module' });
    res.json({
      module_id: quiz.module_id,
      module_title: quiz.module_title,
      difficulty: quiz.difficulty,
      passThresholdPct: PASS_THRESHOLD_PCT,
      totals: Object.fromEntries(quiz.totals || []),
      bloom_distribution: Object.fromEntries(quiz.bloom_distribution || []),
      mini_quizzes: quiz.mini_quizzes.map((mq) => ({
        mq: mq.mq,
        title: mq.title,
        source_lesson: mq.source_lesson,
        questionCount: mq.questions.length
      }))
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Starts an attempt and returns the issued questions without answers.
 *
 * The set of question ids is recorded on the attempt document. Submission is
 * checked against that record, so a client cannot substitute easier questions
 * or replay a single question repeatedly to recover the key.
 */
router.post(
  '/:moduleId/attempts',
  requireAuth,
  attemptLimiter,
  validate({ params: moduleIdParam, body: startAttemptSchema }),
  async (req, res, next) => {
    try {
      const { scope, miniQuiz, questionCount } = req.body;
      if (scope === 'mini' && !miniQuiz) throw badRequest('Specify which mini-quiz to start.');

      const open = await Attempt.countDocuments({ user: req.user._id, status: 'in_progress' });
      if (open >= 5) throw badRequest('Finish or leave one of your open quizzes before starting another.');

      const { questions } = await selectQuestions({
        moduleId: req.params.moduleId,
        scope,
        miniQuiz,
        questionCount
      });
      if (questions.length === 0) throw notFound('That quiz has no questions yet.');

      const attempt = await Attempt.create({
        user: req.user._id,
        module_id: req.params.moduleId,
        scope,
        miniQuiz: scope === 'mini' ? miniQuiz : null,
        issuedQuestionIds: questions.map((q) => q.q_id),
        total: questions.length,
        expiresAt: new Date(Date.now() + ATTEMPT_TTL_MINUTES * 60_000)
      });

      res.status(201).json({
        attempt: {
          id: attempt._id.toString(),
          module_id: attempt.module_id,
          scope: attempt.scope,
          miniQuiz: attempt.miniQuiz,
          total: attempt.total,
          startedAt: attempt.startedAt,
          expiresAt: attempt.expiresAt,
          passThresholdPct: PASS_THRESHOLD_PCT
        },
        questions: toLearnerQuestions(questions)
      });
    } catch (err) {
      next(err);
    }
  }
);

/** Submits an attempt. This is the only route that reveals correct answers. */
router.post(
  '/attempts/:attemptId/submit',
  requireAuth,
  attemptLimiter,
  validate({ params: attemptIdParam, body: submitAttemptSchema }),
  async (req, res, next) => {
    try {
      const attempt = await Attempt.findById(req.params.attemptId);
      if (!attempt) throw notFound('That attempt no longer exists.');
      if (!attempt.user.equals(req.user._id)) throw forbidden('That attempt belongs to someone else.');
      if (attempt.status !== 'in_progress') throw badRequest('This attempt has already been submitted.');
      if (attempt.expiresAt < new Date()) {
        attempt.status = 'abandoned';
        await attempt.save();
        throw badRequest('This attempt timed out. Start a new one.');
      }

      const { key } = await loadAnswerKey(attempt.module_id, attempt.issuedQuestionIds);
      const result = gradeResponses({
        issuedQuestionIds: attempt.issuedQuestionIds,
        submitted: req.body.responses,
        key
      });

      attempt.responses = result.graded;
      attempt.score = result.score;
      attempt.percentage = result.percentage;
      attempt.passed = result.passed;
      attempt.bloomBreakdown = result.bloomBreakdown;
      attempt.status = 'submitted';
      attempt.submittedAt = new Date();
      await attempt.save();

      const progress = await applyProgress({
        userId: req.user._id,
        moduleId: attempt.module_id,
        attempt,
        result
      });

      res.json({
        result: {
          attemptId: attempt._id.toString(),
          score: result.score,
          total: result.total,
          percentage: result.percentage,
          passed: result.passed,
          passThresholdPct: PASS_THRESHOLD_PCT,
          bloomBreakdown: result.bloomBreakdown
        },
        feedback: buildFeedback(result.graded, key),
        progress: {
          status: progress.status,
          bestModuleScorePct: progress.bestModuleScorePct,
          completedMiniQuizzes: progress.completedMiniQuizzes
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/attempts/:attemptId', requireAuth, validate({ params: attemptIdParam }), async (req, res, next) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId);
    if (!attempt) throw notFound('That attempt no longer exists.');
    if (!attempt.user.equals(req.user._id)) throw forbidden('That attempt belongs to someone else.');

    // An in-progress attempt returns metadata only. Returning graded responses
    // here would let a client poll for the key mid-quiz.
    if (attempt.status === 'in_progress') {
      return res.json({
        attempt: {
          id: attempt._id.toString(),
          module_id: attempt.module_id,
          scope: attempt.scope,
          status: attempt.status,
          total: attempt.total,
          expiresAt: attempt.expiresAt
        }
      });
    }

    const { key } = await loadAnswerKey(attempt.module_id, attempt.issuedQuestionIds);
    res.json({
      attempt: {
        id: attempt._id.toString(),
        module_id: attempt.module_id,
        scope: attempt.scope,
        status: attempt.status,
        score: attempt.score,
        total: attempt.total,
        percentage: attempt.percentage,
        passed: attempt.passed,
        submittedAt: attempt.submittedAt
      },
      feedback: buildFeedback(attempt.responses, key)
    });
  } catch (err) {
    next(err);
  }
});

/** Demo-mode sampler: three questions, graded immediately, nothing persisted. */
router.post('/:moduleId/demo', validate({ params: moduleIdParam }), async (req, res, next) => {
  try {
    if (!env.demoModeEnabled) throw forbidden('Demo mode is turned off.');
    const { questions } = await selectQuestions({
      moduleId: req.params.moduleId,
      scope: 'mini',
      miniQuiz: 1
    });
    res.json({
      demo: true,
      message: 'This is a preview. Create a free account to have your results saved.',
      questions: toLearnerQuestions(questions.slice(0, 3))
    });
  } catch (err) {
    next(err);
  }
});

export default router;
