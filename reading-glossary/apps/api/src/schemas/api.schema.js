import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Enter a valid email address.').max(254);

/**
 * Password policy follows NIST SP 800-63B: length is the primary control, and
 * composition rules are omitted because they push people toward predictable
 * substitutions. The upper bound exists because Argon2 hashing time grows with
 * input length, which is a denial-of-service vector if left unbounded.
 */
const password = z
  .string()
  .min(12, 'Use at least 12 characters. A short phrase works well.')
  .max(200, 'Passwords are capped at 200 characters.');

export const registerSchema = z.object({
  email,
  password,
  displayName: z.string().trim().min(2, 'Enter the name you want to be called.').max(80),
  cohort: z.string().trim().max(64).optional(),
  preferredLanguage: z.enum(['en', 'fr', 'ht', 'es']).default('en')
});

export const loginSchema = z.object({ email, password: z.string().min(1).max(200) });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: password
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(80).optional(),
  cohort: z.string().trim().max(64).nullable().optional(),
  preferredLanguage: z.enum(['en', 'fr', 'ht', 'es']).optional(),
  lowBandwidthMode: z.boolean().optional()
});

export const moduleIdParam = z.object({
  moduleId: z.string().regex(/^[a-z0-9-]{2,80}$/, 'Unknown module.')
});

export const catalogueQuerySchema = z.object({
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

export const startAttemptSchema = z.object({
  scope: z.enum(['mini', 'module', 'superquiz']).default('module'),
  miniQuiz: z.coerce.number().int().min(1).max(20).optional(),
  questionCount: z.coerce.number().int().min(1).max(60).optional()
});

export const submitAttemptSchema = z.object({
  responses: z
    .array(
      z.object({
        q_id: z.string().min(1).max(64),
        selected: z.string().regex(/^[A-H]$/, 'Choose one of the listed options.'),
        timeOnTaskMs: z.number().int().min(0).max(3_600_000).optional()
      })
    )
    .min(1)
    .max(60)
});

export const lessonProgressSchema = z.object({
  miniLesson: z.coerce.number().int().min(1).max(20)
});

export const attemptIdParam = z.object({
  attemptId: z.string().regex(/^[a-f0-9]{24}$/, 'Unknown attempt.')
});
