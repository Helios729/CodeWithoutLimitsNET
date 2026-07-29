/**
 * Offline content linter. No database required, so it can run as a pull-request
 * check on the content repository before anything reaches Railway.
 *
 * Beyond schema validation it checks the things that are easy to get wrong when
 * authoring by hand and impossible to see by reading:
 *   - an answer key pointing at an option letter that is not present
 *   - duplicate q_id values across the whole corpus
 *   - a table_of_contents that disagrees with the questions actually present
 *   - a module whose companion_quiz has no matching quiz file
 *
 * Usage: npm run validate:content -w @cwl/api
 */
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { learningModuleSchema, quizModuleSchema } from '../schemas/content.schema.js';
import { normaliseQuiz, normaliseLearningModule } from '../schemas/normalize.js';

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = resolve(here, '../../', process.env.CONTENT_DIR || '../../content');

const problems = [];
const note = (file, message) => problems.push({ file, message });

async function loadDir(sub) {
  const dir = join(contentDir, sub);
  try {
    const names = (await readdir(dir)).filter((n) => n.endsWith('.json'));
    return Promise.all(
      names.map(async (name) => ({ name, data: JSON.parse(await readFile(join(dir, name), 'utf8')) }))
    );
  } catch {
    return [];
  }
}

const learning = await loadDir('learning');
const quizzes = await loadDir('quiz');

const seenQuestionIds = new Map();
const quizByModule = new Map();

// Difficulty fallback chain, matching ingest.js: companion learning module
// first, then the catalogue entry.
const difficultyByModule = new Map();
try {
  const entries = JSON.parse(await readFile(join(contentDir, 'catalogue.json'), 'utf8'));
  for (const entry of entries) {
    if (entry.id && entry.difficulty) difficultyByModule.set(entry.id, entry.difficulty);
  }
} catch {
  // No catalogue is a warning elsewhere, not a failure here.
}
for (const f of learning) {
  if (f.data?.module_id && f.data.difficulty) difficultyByModule.set(f.data.module_id, f.data.difficulty);
}

for (const file of learning) {
  const parsed = learningModuleSchema.safeParse(normaliseLearningModule(file.data));
  if (!parsed.success) {
    for (const issue of parsed.error.issues) note(file.name, `${issue.path.join('.')}: ${issue.message}`);
    continue;
  }
  const lessons = parsed.data.mini_lessons.map((l) => l.ml);
  const expected = Array.from({ length: lessons.length }, (_, i) => i + 1);
  if (JSON.stringify(lessons) !== JSON.stringify(expected)) {
    note(file.name, `mini_lessons should be numbered 1..${lessons.length}, found ${lessons.join(', ')}`);
  }
}

for (const file of quizzes) {
  let normalised;
  try {
    ({ quiz: normalised } = normaliseQuiz(file.data, {
      difficulty: difficultyByModule.get(file.data?.module_id)
    }));
  } catch (err) {
    note(file.name, err.message);
    continue;
  }

  const parsed = quizModuleSchema.safeParse(normalised);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) note(file.name, `${issue.path.join('.')}: ${issue.message}`);
    continue;
  }

  const quiz = parsed.data;
  quizByModule.set(quiz.module_id, quiz);

  let counted = 0;
  for (const mq of quiz.mini_quizzes) {
    counted += mq.questions.length;
    for (const q of mq.questions) {
      if (seenQuestionIds.has(q.q_id)) {
        note(file.name, `duplicate q_id ${q.q_id}, also in ${seenQuestionIds.get(q.q_id)}`);
      }
      seenQuestionIds.set(q.q_id, file.name);
    }
  }

  const declared = file.data.totals?.questions ?? file.data.total_questions;
  if (typeof declared === 'number' && declared !== counted) {
    note(file.name, `totals.questions says ${declared} but ${counted} questions are present`);
  }

  for (const toc of quiz.table_of_contents ?? []) {
    const mq = quiz.mini_quizzes.find((m) => m.mq === toc.mq);
    if (!mq) {
      note(file.name, `table_of_contents references mini-quiz ${toc.mq} which does not exist`);
      continue;
    }
    const actual = mq.questions.map((q) => q.q_id);
    const listed = toc.q_ids ?? [];
    if (listed.length && JSON.stringify(listed) !== JSON.stringify(actual)) {
      note(file.name, `table_of_contents q_ids for MQ-${toc.mq} do not match the questions present`);
    }
  }
}

/**
 * File-prefix collision check.
 *
 * Two modules that share a numeric prefix (L09 and L09) are a genuine authoring
 * hazard: on a case-insensitive filesystem, or in any copy step that flattens
 * directories, one silently overwrites the other. The a/b suffix convention
 * (L09a, L09b, L10a, L10b) exists to prevent that, and this check enforces it.
 */
function prefixOf(name) {
  const match = /^([LQ]\d+)(?=[_a-z])/i.exec(name);
  return match ? match[1].toUpperCase() : null;
}

for (const group of [
  { label: 'learning', files: learning },
  { label: 'quiz', files: quizzes }
]) {
  const byPrefix = new Map();
  for (const file of group.files) {
    const prefix = prefixOf(file.name);
    if (!prefix) continue;
    // A bare prefix with no letter suffix, e.g. "L09_" rather than "L09a_".
    if (/^[LQ]\d+_/.test(file.name)) {
      if (!byPrefix.has(prefix)) byPrefix.set(prefix, []);
      byPrefix.get(prefix).push(file.name);
    }
  }
  for (const [prefix, names] of byPrefix) {
    if (names.length > 1) {
      note(
        '(naming)',
        `${names.length} ${group.label} files share the prefix ${prefix}: ${names.join(', ')}. ` +
          `Add a letter suffix (${prefix}a, ${prefix}b) to keep them distinct.`
      );
    }
  }
}

/**
 * Catalogue duration drift.
 *
 * The module file is authoritative: ingest.js spreads the validated module
 * document and the marketing overrides do not include duration_min, so a
 * catalogue entry that disagrees is stating a number the product never uses.
 * Harmless today, but it is the kind of quiet inconsistency that gets copied
 * into a prospectus or a funding report and then has to be defended.
 */
try {
  const entries = JSON.parse(await readFile(join(contentDir, 'catalogue.json'), 'utf8'));
  const declared = new Map(learning.map((f) => [f.data.module_id, f.data.duration_min]));
  for (const entry of entries) {
    const actual = declared.get(entry.id);
    if (actual !== undefined && actual !== entry.duration_min) {
      note(
        'catalogue.json',
        `${entry.id}: card says ${entry.duration_min} min, module file says ${actual} min. ` +
          'Run merge-catalogue.mjs --durations-only --write to move the card onto the module value.'
      );
    }
  }
} catch {
  // A missing catalogue is reported elsewhere.
}

const learningIds = new Set(
  learning.map((f) => f.data.module_id).filter(Boolean)
);
for (const id of learningIds) {
  if (!quizByModule.has(id)) note('(pairing)', `learning module "${id}" has no companion quiz file`);
}
for (const id of quizByModule.keys()) {
  if (!learningIds.has(id)) note('(pairing)', `quiz "${id}" has no companion learning module file`);
}

console.log(`Checked ${learning.length} learning files and ${quizzes.length} quiz files.`);
console.log(`Total questions indexed: ${seenQuestionIds.size}`);

if (problems.length === 0) {
  console.log('No problems found.');
  process.exit(0);
}

console.error(`\n${problems.length} problem(s):`);
for (const p of problems) console.error(`  ${p.file}: ${p.message}`);
process.exit(1);
