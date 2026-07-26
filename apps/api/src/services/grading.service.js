import { Quiz } from '../models/Quiz.js';
import { Progress } from '../models/Progress.js';
import { badRequest, notFound } from '../lib/errors.js';

export const PASS_THRESHOLD_PCT = 70;

/**
 * Loads the answer key for a set of question ids.
 *
 * The `answer` and `explanation` fields are `select: false` on the schema, so
 * this is the one place in the codebase that opts back in. Keeping it to a
 * single function makes the blast radius auditable: if answers ever leak, the
 * leak passed through here.
 */
export async function loadAnswerKey(moduleId, questionIds) {
  const quiz = await Quiz.findOne({ module_id: moduleId, published: true }).select(
    '+mini_quizzes.questions.answer +mini_quizzes.questions.explanation'
  );
  if (!quiz) throw notFound('That quiz is not available.');

  const wanted = new Set(questionIds);
  const key = new Map();

  for (const miniQuiz of quiz.mini_quizzes) {
    for (const question of miniQuiz.questions) {
      if (!wanted.has(question.q_id)) continue;
      key.set(question.q_id, {
        answer: question.answer,
        explanation: question.explanation,
        bloom: question.bloom,
        stem: question.stem,
        source: question.source,
        options: Object.fromEntries(question.options),
        mq: miniQuiz.mq
      });
    }
  }

  return { quiz, key };
}

/**
 * Grades a submission against the key. Every rule that decides a mark lives on
 * the server: the client sends only which option was chosen.
 */
export function gradeResponses({ issuedQuestionIds, submitted, key }) {
  const issued = new Set(issuedQuestionIds);
  const seen = new Set();
  const graded = [];
  const bloomBreakdown = {};

  for (const response of submitted) {
    if (!issued.has(response.q_id)) {
      throw badRequest(`Question ${response.q_id} was not part of this attempt.`);
    }
    if (seen.has(response.q_id)) {
      throw badRequest(`Question ${response.q_id} was answered more than once.`);
    }
    seen.add(response.q_id);

    const entry = key.get(response.q_id);
    if (!entry) throw badRequest(`Question ${response.q_id} could not be graded.`);

    if (!Object.prototype.hasOwnProperty.call(entry.options, response.selected)) {
      throw badRequest(`"${response.selected}" is not an option for ${response.q_id}.`);
    }

    const correct = response.selected === entry.answer;
    graded.push({
      q_id: response.q_id,
      selected: response.selected,
      correct,
      bloom: entry.bloom,
      timeOnTaskMs: response.timeOnTaskMs ?? null,
      answeredAt: new Date()
    });

    bloomBreakdown[entry.bloom] ??= { correct: 0, total: 0 };
    bloomBreakdown[entry.bloom].total += 1;
    if (correct) bloomBreakdown[entry.bloom].correct += 1;
  }

  // Unanswered issued questions count against the score. Skipping is not a
  // way to protect a percentage.
  const total = issuedQuestionIds.length;
  const score = graded.filter((g) => g.correct).length;
  const percentage = Math.round((score / total) * 1000) / 10;

  return {
    graded,
    score,
    total,
    percentage,
    passed: percentage >= PASS_THRESHOLD_PCT,
    bloomBreakdown
  };
}

/** Feedback returned only after a submission is recorded, never before. */
export function buildFeedback(graded, key) {
  return graded.map((g) => {
    const entry = key.get(g.q_id);
    return {
      q_id: g.q_id,
      stem: entry.stem,
      bloom: entry.bloom,
      selected: g.selected,
      selectedText: entry.options[g.selected],
      correctOption: entry.answer,
      correctText: entry.options[entry.answer],
      correct: g.correct,
      explanation: entry.explanation,
      source: entry.source
    };
  });
}

export async function applyProgress({ userId, moduleId, attempt, result }) {
  const progress = await Progress.findOneAndUpdate(
    { user: userId, module_id: moduleId },
    {
      $setOnInsert: { startedAt: new Date() },
      $set: { lastAccessedAt: new Date(), status: 'in_progress' },
      $inc: { attemptCount: 1 }
    },
    { upsert: true, new: true }
  );

  if (attempt.scope === 'mini' && attempt.miniQuiz && result.passed) {
    if (!progress.completedMiniQuizzes.includes(attempt.miniQuiz)) {
      progress.completedMiniQuizzes.push(attempt.miniQuiz);
      progress.completedMiniQuizzes.sort((a, b) => a - b);
    }
  }

  if (progress.bestModuleScorePct === null || result.percentage > progress.bestModuleScorePct) {
    if (attempt.scope !== 'mini') progress.bestModuleScorePct = result.percentage;
  }

  for (const [level, counts] of Object.entries(result.bloomBreakdown)) {
    const existing = progress.bloomMastery.get(level) || { correct: 0, total: 0 };
    progress.bloomMastery.set(level, {
      correct: existing.correct + counts.correct,
      total: existing.total + counts.total
    });
  }

  if (attempt.scope !== 'mini' && result.passed) {
    progress.status = 'completed';
    progress.completedAt ??= new Date();
  }

  await progress.save();
  return progress;
}
