import crypto from 'node:crypto';
import { Quiz } from '../models/Quiz.js';
import { notFound } from '../lib/errors.js';

/**
 * Cryptographically seeded Fisher-Yates. Math.random is fine for a carousel;
 * it is not fine for deciding which questions a learner is assessed on, because
 * its output is predictable enough to be replayed.
 */
export function shuffle(items) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Selects questions for an attempt.
 *
 * `superquiz_pool` in the authored JSON lists option keys A-H, which the
 * curriculum uses to mark a question as eligible for the cross-module
 * superquiz. Selection is stratified by Bloom level so a shuffled sitting keeps
 * the intended 2/2/1 remember-understand-apply shape rather than accidentally
 * serving five recall questions.
 */
export async function selectQuestions({ moduleId, scope, miniQuiz, questionCount }) {
  const quiz = await Quiz.findOne({ module_id: moduleId, published: true });
  if (!quiz) throw notFound('That quiz is not available yet.');

  let pool = [];
  if (scope === 'mini') {
    const target = quiz.mini_quizzes.find((mq) => mq.mq === Number(miniQuiz));
    if (!target) throw notFound(`Mini-quiz ${miniQuiz} does not exist in this module.`);
    pool = target.questions.map((q) => ({ ...q.toObject(), mq: target.mq }));
  } else {
    pool = quiz.mini_quizzes.flatMap((mq) =>
      mq.questions.map((q) => ({ ...q.toObject(), mq: mq.mq }))
    );
  }

  if (!questionCount || questionCount >= pool.length) {
    return { quiz, questions: scope === 'mini' ? pool : shuffle(pool) };
  }

  const byBloom = pool.reduce((acc, q) => {
    (acc[q.bloom] ??= []).push(q);
    return acc;
  }, {});

  const levels = Object.keys(byBloom).sort();
  const selected = [];
  let cursor = 0;

  // Round-robin across Bloom levels until the target count is reached.
  while (selected.length < questionCount) {
    const level = levels[cursor % levels.length];
    const bucket = byBloom[level];
    if (bucket?.length) selected.push(bucket.splice(crypto.randomInt(0, bucket.length), 1)[0]);
    cursor += 1;
    if (levels.every((l) => byBloom[l].length === 0)) break;
  }

  return { quiz, questions: shuffle(selected) };
}

/** Strips the answer key before questions are handed to a client. */
export const toLearnerQuestions = (questions) =>
  questions.map((q) => ({
    q_id: q.q_id,
    mq: q.mq,
    bloom: q.bloom,
    skill: q.skill,
    stem: q.stem,
    options: q.options instanceof Map ? Object.fromEntries(q.options) : q.options
  }));
