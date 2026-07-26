import { z } from 'zod';

/**
 * Validation for authored content. Applied at ingestion, not at request time,
 * so a malformed lesson file fails the deploy pipeline rather than surfacing as
 * a blank screen for a learner halfway through a module.
 */

const difficulty = z.enum(['Beginner', 'Intermediate', 'Advanced']);
/**
 * Accepts both the bare code ("L1") and the long-form label ("L1 Remember"),
 * and stores the bare code either way. Two dialects exist in the authored
 * corpus and both are legitimate.
 */
const bloom = z
  .string()
  .transform((v) => {
    const match = /^\s*(L[1-6])\b/i.exec(String(v).trim());
    return match ? match[1].toUpperCase() : String(v).trim();
  })
  .pipe(z.enum(['L1', 'L2', 'L3', 'L4', 'L5', 'L6']));

export const sourceSchema = z.object({
  id: z.string().min(1),
  citation: z.string().min(1),
  url: z.string().url(),
  access: z.string().default('')
});

export const learningModuleSchema = z.object({
  module_id: z.string().regex(/^[a-z0-9-]+$/, 'module_id must be lowercase kebab-case'),
  module_title: z.string().min(1),
  type: z.literal('learning'),
  difficulty,
  duration_min: z.number().int().positive(),
  bloom_levels_covered: z.array(z.string()).default([]),
  companion_quiz: z.string().default(''),
  sources: z.array(sourceSchema).min(1),
  learning_objectives: z.array(z.string()).min(1),
  mini_lessons: z
    .array(
      z.object({
        ml: z.number().int().positive(),
        title: z.string().min(1),
        bloom: z.string().default(''),
        companion_mini_quiz: z.string().default(''),
        concepts: z
          .array(
            z.object({
              title: z.string().min(1),
              explanation: z.string().min(1),
              worked_example: z.string().default(''),
              source_refs: z.array(z.string()).default([])
            })
          )
          .min(1)
      })
    )
    .min(1)
});

export const questionSchema = z
  .object({
    q_id: z.string().min(1),
    bloom,
    skill: z.string().default(''),
    stem: z.string().min(1),
    options: z.record(z.string().regex(/^[A-H]$/), z.string().min(1)),
    answer: z.string().regex(/^[A-H]$/),
    explanation: z.string().default(''),
    source: z.string().default('')
  })
  .refine((q) => Object.keys(q.options).length >= 2, {
    message: 'A question needs at least two options'
  })
  // The single most valuable content check in the pipeline: an answer key that
  // points at an option which does not exist makes the question ungradeable and
  // is invisible on visual review.
  .refine((q) => Object.prototype.hasOwnProperty.call(q.options, q.answer), {
    message: 'answer must reference one of the supplied option keys'
  });

/**
 * Applied AFTER normalise.js has run, so the fields the normaliser derives are
 * required here rather than optional. Validating the normalised shape means a
 * genuinely broken file is still rejected; it is only the dialect differences
 * that are smoothed over.
 */
export const quizModuleSchema = z.object({
  module_id: z.string().regex(/^[a-z0-9-]+$/),
  module_title: z.string().min(1),
  type: z.literal('quiz'),
  difficulty,
  companion_learning: z.string().default(''),
  superquiz_pool: z.array(z.string()).default([]),
  bloom_distribution: z.record(z.string(), z.number().int().nonnegative()).default({}),
  mini_quizzes: z
    .array(
      z.object({
        mq: z.number().int().positive(),
        title: z.string().min(1),
        source_lesson: z.string().default(''),
        questions: z.array(questionSchema).min(1)
      })
    )
    .min(1),
  table_of_contents: z.array(z.any()).default([]),
  totals: z.record(z.string(), z.number().int().nonnegative()).default({})
});

export const catalogueEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  tagline: z.string().default(''),
  difficulty,
  duration_min: z.number().int().positive(),
  price_cents: z.number().int().nonnegative().default(0),
  thumb: z.string().default(''),
  description: z.string().default(''),
  what_you_learn: z.array(z.string()).default([]),
  affiliate_url: z.string().url().optional().or(z.literal(''))
});
