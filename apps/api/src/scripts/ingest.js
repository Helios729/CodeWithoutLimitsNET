/**
 * Content ingestion.
 *
 * Reads the authored JSON in content/, validates every file against the Zod
 * content schemas, and upserts into MongoDB. Files that fail validation are
 * reported and skipped; the run exits non-zero so a deploy pipeline stops
 * rather than shipping a half-loaded catalogue.
 *
 * Idempotent: a SHA-256 of each file is stored, and unchanged files are left
 * alone, so this is safe to run on every deploy.
 *
 * Usage:
 *   npm run ingest -w @cwl/api
 *   npm run ingest -w @cwl/api -- --dry-run
 */
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { env } from '../config/env.js';
import { Module } from '../models/Module.js';
import { Quiz } from '../models/Quiz.js';
import { AuditLog } from '../models/AuditLog.js';
import { learningModuleSchema, quizModuleSchema, catalogueEntrySchema } from '../schemas/content.schema.js';
import { normaliseQuiz, normaliseLearningModule } from '../schemas/normalize.js';

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = resolve(here, '../../', env.CONTENT_DIR);
const dryRun = process.argv.includes('--dry-run');

const sha = (text) => createHash('sha256').update(text).digest('hex');

async function readJsonDir(dir) {
  let names = [];
  try {
    names = (await readdir(dir)).filter((n) => n.endsWith('.json'));
  } catch {
    return [];
  }
  return Promise.all(
    names.map(async (name) => {
      const raw = await readFile(join(dir, name), 'utf8');
      return { name, raw, data: JSON.parse(raw) };
    })
  );
}

async function loadCatalogue() {
  try {
    const raw = await readFile(join(contentDir, 'catalogue.json'), 'utf8');
    const entries = JSON.parse(raw);
    const index = new Map();
    for (const entry of entries) {
      const parsed = catalogueEntrySchema.safeParse(entry);
      if (parsed.success) index.set(parsed.data.id, parsed.data);
      else console.warn(`  catalogue entry "${entry.id}" skipped: ${parsed.error.issues[0].message}`);
    }
    return index;
  } catch {
    console.warn('  no catalogue.json found; modules will ingest without marketing copy');
    return new Map();
  }
}

async function run() {
  console.log(`Reading content from ${contentDir}`);
  await connectDatabase();

  const catalogue = await loadCatalogue();
  const learningFiles = await readJsonDir(join(contentDir, 'learning'));
  const quizFiles = await readJsonDir(join(contentDir, 'quiz'));

  const report = { modules: 0, quizzes: 0, skipped: 0, unchanged: 0, failures: [] };

  // Order in the catalogue drives display order in the app and on the website.
  const order = new Map([...catalogue.keys()].map((id, index) => [id, index]));

  // Difficulty fallback chain for quiz files that omit it: the companion
  // learning module first, then the catalogue entry. A quiz is only rejected
  // when no source in the repository declares a level for that module.
  const difficultyByModule = new Map();
  for (const [id, entry] of catalogue) {
    if (entry.difficulty) difficultyByModule.set(id, entry.difficulty);
  }
  for (const f of learningFiles) {
    if (f.data?.module_id && f.data.difficulty) difficultyByModule.set(f.data.module_id, f.data.difficulty);
  }

  for (const file of learningFiles) {
    const parsed = learningModuleSchema.safeParse(normaliseLearningModule(file.data));
    if (!parsed.success) {
      report.failures.push({ file: file.name, issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) });
      report.skipped += 1;
      continue;
    }

    const doc = parsed.data;
    const hash = sha(file.raw);
    const existing = await Module.findOne({ module_id: doc.module_id }).select('contentHash');
    if (existing?.contentHash === hash) {
      report.unchanged += 1;
      continue;
    }

    const marketing = catalogue.get(doc.module_id) ?? {};
    if (!dryRun) {
      await Module.findOneAndUpdate(
        { module_id: doc.module_id },
        {
          $set: {
            ...doc,
            tagline: marketing.tagline ?? '',
            description: marketing.description ?? '',
            what_you_learn: marketing.what_you_learn ?? [],
            thumb: marketing.thumb ?? '',
            affiliate_url: marketing.affiliate_url ?? '',
            price_cents: marketing.price_cents ?? 0,
            order: order.get(doc.module_id) ?? 999,
            published: true,
            contentHash: hash,
            ingestedAt: new Date()
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    report.modules += 1;
    console.log(`  module  ${doc.module_id} (${doc.mini_lessons.length} mini-lessons)`);
  }

  for (const file of quizFiles) {
    let normalised;
    let notes = [];
    try {
      const result = normaliseQuiz(file.data, {
        difficulty: difficultyByModule.get(file.data?.module_id)
      });
      normalised = result.quiz;
      notes = result.notes;
    } catch (err) {
      report.failures.push({ file: file.name, issues: [err.message] });
      report.skipped += 1;
      continue;
    }

    const parsed = quizModuleSchema.safeParse(normalised);
    if (!parsed.success) {
      report.failures.push({ file: file.name, issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) });
      report.skipped += 1;
      continue;
    }

    const doc = parsed.data;
    const hash = sha(file.raw);
    const existing = await Quiz.findOne({ module_id: doc.module_id }).select('contentHash');
    if (existing?.contentHash === hash) {
      report.unchanged += 1;
      continue;
    }

    const questionCount = doc.mini_quizzes.reduce((n, mq) => n + mq.questions.length, 0);
    if (!dryRun) {
      await Quiz.findOneAndUpdate(
        { module_id: doc.module_id },
        { $set: { ...doc, published: true, contentHash: hash, ingestedAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    report.quizzes += 1;
    console.log(`  quiz    ${doc.module_id} (${questionCount} questions)`);
    // Inferred fields are announced, not hidden. If the normaliser had to guess,
    // the author should be able to see what it guessed.
    for (const note of notes) console.log(`            note: ${note}`);
  }

  // Catalogue order and marketing belong to catalogue.json, not to the lesson
  // files. Re-apply them on every run so that editing catalogue.json alone is
  // enough to reorder or re-describe a course, even when its lesson content was
  // unchanged (and therefore skipped above).
  if (!dryRun && catalogue.size > 0) {
    let resynced = 0;
    for (const [id, entry] of catalogue) {
      const res = await Module.updateOne(
        { module_id: id },
        {
          $set: {
            order: order.get(id) ?? 999,
            tagline: entry.tagline ?? '',
            description: entry.description ?? '',
            what_you_learn: entry.what_you_learn ?? [],
            thumb: entry.thumb ?? '',
            affiliate_url: entry.affiliate_url ?? '',
            price_cents: entry.price_cents ?? 0
          }
        }
      );
      if (res.matchedCount) resynced += 1;
    }
    console.log(`  catalogue metadata re-synced for ${resynced} module(s)`);
  }

  // Report modules whose companion quiz has not been ingested. Shipping a
  // module with a dead "Take the quiz" button is a worse learner experience
  // than not listing the module at all.
  const [moduleIds, quizIds] = await Promise.all([
    Module.distinct('module_id', { published: true }),
    Quiz.distinct('module_id', { published: true })
  ]);
  const orphans = moduleIds.filter((id) => !quizIds.includes(id));
  const strays = quizIds.filter((id) => !moduleIds.includes(id));

  console.log('\nIngestion summary');
  console.log(`  modules written  ${report.modules}`);
  console.log(`  quizzes written  ${report.quizzes}`);
  console.log(`  unchanged        ${report.unchanged}`);
  console.log(`  skipped          ${report.skipped}`);
  if (orphans.length) console.log(`  modules with no quiz: ${orphans.join(', ')}`);
  if (strays.length) console.log(`  quizzes with no module: ${strays.join(', ')}`);

  if (report.failures.length) {
    console.error('\nValidation failures:');
    for (const failure of report.failures) {
      console.error(`  ${failure.file}`);
      for (const issue of failure.issues.slice(0, 5)) console.error(`      ${issue}`);
    }
  }

  if (!dryRun) {
    await AuditLog.create({
      action: 'content.ingest',
      meta: { modules: report.modules, quizzes: report.quizzes, skipped: report.skipped, orphans }
    }).catch(() => {});
  }

  await disconnectDatabase();
  process.exit(report.failures.length ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
