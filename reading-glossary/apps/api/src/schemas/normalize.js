/**
 * Content normalisation.
 *
 * The authored corpus contains two quiz dialects. Q01-style files carry
 * `difficulty`, `skill`, `source_lesson`, `superquiz_pool`, `bloom_distribution`,
 * `table_of_contents` and `totals`, and write Bloom levels as bare codes ("L1").
 * Q03-style files omit those fields, use `total_questions` in place of `totals`,
 * and spell Bloom levels out in full ("L1 Remember").
 *
 * Both are legitimate. Rewriting the JSON by hand to force one shape would mean
 * editing the curriculum author's source of truth every time a file arrives,
 * and would silently diverge the repository from the Drive folder. Normalising
 * on the way in keeps the authored files untouched and gives the database one
 * consistent shape to store.
 *
 * Everything derivable is derived rather than demanded: totals are counted from
 * the questions present, difficulty is inherited from the companion learning
 * module, and a table of contents is generated when one is absent.
 */

/** "L1 Remember" -> "L1"; "L1" -> "L1"; "l2 understand" -> "L2". */
export function normaliseBloom(value) {
  if (typeof value !== 'string') return value;
  const match = /^\s*(L[1-6])\b/i.exec(value.trim());
  return match ? match[1].toUpperCase() : value.trim();
}

const BLOOM_LABELS = {
  L1: 'L1 Remember',
  L2: 'L2 Understand',
  L3: 'L3 Apply',
  L4: 'L4 Analyse',
  L5: 'L5 Evaluate',
  L6: 'L6 Create'
};

/**
 * Brings a quiz file into the canonical shape.
 *
 * @param {object} raw            the parsed JSON exactly as authored
 * @param {object} [context]
 * @param {string} [context.difficulty]  fallback difficulty, normally taken
 *                                       from the companion learning module
 * @returns {{ quiz: object, notes: string[] }} notes record every field that had
 *          to be inferred, so ingestion can report them rather than hide them
 */
export function normaliseQuiz(raw, context = {}) {
  const notes = [];
  const quiz = { ...raw, type: 'quiz' };

  quiz.mini_quizzes = (raw.mini_quizzes ?? []).map((mq) => ({
    mq: mq.mq,
    title: mq.title,
    source_lesson: mq.source_lesson ?? `ML-${mq.mq}`,
    questions: (mq.questions ?? []).map((q) => ({
      q_id: q.q_id,
      bloom: normaliseBloom(q.bloom),
      skill: q.skill ?? '',
      stem: q.stem,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation ?? '',
      source: q.source ?? ''
    }))
  }));

  if (raw.mini_quizzes?.some((mq) => mq.source_lesson === undefined)) {
    notes.push('source_lesson inferred from the mini-quiz number');
  }
  if (
    raw.mini_quizzes?.some((mq) =>
      mq.questions?.some((q) => normaliseBloom(q.bloom) !== q.bloom)
    )
  ) {
    notes.push('Bloom levels shortened from long-form labels');
  }

  const allQuestions = quiz.mini_quizzes.flatMap((mq) => mq.questions);

  if (!quiz.difficulty) {
    if (!context.difficulty) {
      throw new Error(
        `${raw.module_id}: no difficulty in the quiz file and no companion learning module to inherit it from`
      );
    }
    quiz.difficulty = context.difficulty;
    notes.push(`difficulty inherited from the learning module (${context.difficulty})`);
  }

  // Bloom distribution: per mini-quiz shape, counted rather than trusted.
  if (!quiz.bloom_distribution || Object.keys(quiz.bloom_distribution).length === 0) {
    const perMiniQuiz = quiz.mini_quizzes[0]?.questions ?? [];
    const counts = {};
    for (const q of perMiniQuiz) {
      const key = `${q.bloom.toLowerCase()}_${(BLOOM_LABELS[q.bloom] ?? q.bloom).split(' ')[1]?.toLowerCase() ?? 'level'}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    quiz.bloom_distribution = counts;
    notes.push('bloom_distribution counted from mini-quiz 1');
  }

  // Totals: `totals` wins, then the `total_questions` alias, then a count.
  const declaredTotal = raw.totals?.questions ?? raw.total_questions;
  if (declaredTotal !== undefined && declaredTotal !== allQuestions.length) {
    notes.push(
      `declared question count (${declaredTotal}) does not match the ${allQuestions.length} questions present; using the actual count`
    );
  }
  if (!raw.totals) {
    const byLevel = {};
    for (const q of allQuestions) byLevel[q.bloom] = (byLevel[q.bloom] ?? 0) + 1;
    quiz.totals = {
      mini_quizzes: quiz.mini_quizzes.length,
      questions: allQuestions.length,
      ...byLevel
    };
    notes.push('totals derived from the questions present');
  }

  // The superquiz pool marks which option keys are eligible for the
  // cross-module superquiz. Absent means every key in use is eligible.
  if (!quiz.superquiz_pool || quiz.superquiz_pool.length === 0) {
    quiz.superquiz_pool = [
      ...new Set(allQuestions.flatMap((q) => Object.keys(q.options)))
    ].sort();
    notes.push('superquiz_pool derived from the option keys in use');
  }

  if (!quiz.table_of_contents || quiz.table_of_contents.length === 0) {
    quiz.table_of_contents = quiz.mini_quizzes.map((mq) => {
      const counts = {};
      for (const q of mq.questions) counts[q.bloom] = (counts[q.bloom] ?? 0) + 1;
      return {
        mq: mq.mq,
        title: mq.title,
        bloom_mix: Object.entries(counts)
          .sort()
          .map(([level, n]) => `${n}x${level}`)
          .join(', '),
        q_ids: mq.questions.map((q) => q.q_id)
      };
    });
    notes.push('table_of_contents generated from the mini-quizzes');
  }

  delete quiz.total_questions;
  return { quiz, notes };
}

/** Learning modules only need Bloom shortening; the rest of the shape is stable. */
export function normaliseLearningModule(raw) {
  return {
    ...raw,
    type: 'learning',
    mini_lessons: (raw.mini_lessons ?? []).map((lesson) => ({
      ...lesson,
      concepts: (lesson.concepts ?? []).map((concept) => ({
        title: concept.title,
        explanation: concept.explanation,
        worked_example: concept.worked_example ?? '',
        source_refs: concept.source_refs ?? []
      }))
    }))
  };
}
