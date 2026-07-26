/**
 * Merges draft catalogue entries into content/catalogue.json.
 *
 * Kept as a script rather than done by hand because catalogue order drives
 * display order in both the app and the website: ingest.js assigns each module
 * an `order` from its index in this file. Inserting an entry in the wrong place
 * silently reshuffles the catalogue for every learner.
 *
 * Entries are placed in curriculum sequence rather than appended, and the merge
 * refuses to overwrite an existing id.
 *
 * Usage:
 *   node apps/api/src/scripts/merge-catalogue.mjs                    (dry run)
 *   node apps/api/src/scripts/merge-catalogue.mjs --write
 *   node apps/api/src/scripts/merge-catalogue.mjs --sync-durations --write
 *   node apps/api/src/scripts/merge-catalogue.mjs --durations-only --write
 *
 * --sync-durations copies duration_min from each module's own JSON file into its
 * catalogue entry. The module file is authoritative: ingest.js spreads the
 * validated module document and the marketing overrides do not include
 * duration_min, so the module value is what reaches the database either way.
 * Syncing keeps the catalogue from stating a number the product never uses.
 *
 * --durations-only syncs durations without adding any draft entries, so the two
 * operations can happen independently. Correcting a number should not force a
 * decision about copy that is still being edited.
 */
import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalogueEntrySchema } from '../schemas/content.schema.js';

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = resolve(here, '../../../../content');
const write = process.argv.includes('--write');
const durationsOnly = process.argv.includes('--durations-only');
const syncDurations = durationsOnly || process.argv.includes('--sync-durations');

/** Curriculum sequence. Anything not listed keeps its current relative position. */
const SEQUENCE = [
  'introduction-to-ai',
  'edtech-and-learning-science',
  'ai-ethics-and-responsible-use',
  'algorithms-and-data-structures',
  'python-fundamentals',
  'machine-learning',
  'neural-networks-and-deep-learning',
  'natural-language-processing',
  'robotics-and-autonomous-systems',
  'ai-in-society-and-the-future',
  'generative-ai-and-llms',
  'html-beginner',
  'html-intermediate',
  'html-advanced'
];

const existing = JSON.parse(await readFile(join(contentDir, 'catalogue.json'), 'utf8'));
const drafts = JSON.parse(await readFile(join(contentDir, 'catalogue-additions.draft.json'), 'utf8'));

const byId = new Map(existing.map((entry) => [entry.id, entry]));
const added = [];
const skipped = [];

for (const draft of durationsOnly ? [] : drafts) {
  const parsed = catalogueEntrySchema.safeParse(draft);
  if (!parsed.success) {
    console.error(`  ${draft.id}: ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`);
    process.exitCode = 1;
    continue;
  }
  if (byId.has(draft.id)) {
    skipped.push(draft.id);
    continue;
  }
  byId.set(draft.id, draft);
  added.push(draft.id);
}

const ordered = [
  ...SEQUENCE.filter((id) => byId.has(id)).map((id) => byId.get(id)),
  ...[...byId.keys()].filter((id) => !SEQUENCE.includes(id)).map((id) => byId.get(id))
];

// Duration in the catalogue is display copy; the module file is authoritative
// and is what ingest stores. A disagreement is a copy bug, not a data bug, but
// it still shows a learner the wrong number on the card.
const { readdir } = await import('node:fs/promises');
const moduleDurations = new Map();
for (const name of (await readdir(join(contentDir, 'learning'))).filter((n) => n.endsWith('.json'))) {
  const mod = JSON.parse(await readFile(join(contentDir, 'learning', name), 'utf8'));
  moduleDurations.set(mod.module_id, mod.duration_min);
}
const drift = ordered.filter(
  (e) => moduleDurations.has(e.id) && moduleDurations.get(e.id) !== e.duration_min
);

const mismatches = drift.map(
  (e) => `${e.id}: catalogue ${e.duration_min} min, module file ${moduleDurations.get(e.id)} min`
);

const synced = [];
if (syncDurations) {
  for (const entry of drift) {
    synced.push(`${entry.id}: ${entry.duration_min} -> ${moduleDurations.get(entry.id)} min`);
    entry.duration_min = moduleDurations.get(entry.id);
  }
}

// Entries whose module file is not in the repository yet cannot be checked.
// Naming them is more useful than implying the whole catalogue was verified.
const unverifiable = ordered.filter((e) => !moduleDurations.has(e.id)).map((e) => e.id);

console.log(
  durationsOnly
    ? `Catalogue: ${ordered.length} entries, durations only. No draft entries added.`
    : `Catalogue: ${existing.length} entries in, ${ordered.length} out.`
);
if (added.length) console.log(`  added:   ${added.join(', ')}`);
if (skipped.length) console.log(`  skipped: ${skipped.join(', ')} (already present, left untouched)`);
if (syncDurations && synced.length) {
  console.log('\n  durations synced to the module files:');
  for (const line of synced) console.log(`    ${line}`);
} else if (mismatches.length) {
  console.log('\n  duration disagreements between catalogue and module files:');
  for (const m of mismatches) console.log(`    ${m}`);
  console.log('    re-run with --sync-durations to move the catalogue onto the module values');
}

if (unverifiable.length) {
  console.log(
    `\n  not checked (module file not in the repository yet): ${unverifiable.join(', ')}`
  );
  console.log('    run the Drive fetch, then re-run this with --sync-durations');
}

if (write) {
  await copyFile(join(contentDir, 'catalogue.json'), join(contentDir, 'catalogue.backup.json'));
  await writeFile(join(contentDir, 'catalogue.json'), `${JSON.stringify(ordered, null, 2)}\n`, 'utf8');
  console.log('\nWrote catalogue.json. Previous version saved as catalogue.backup.json.');
} else {
  console.log('\nDry run. Re-run with --write to apply.');
}
