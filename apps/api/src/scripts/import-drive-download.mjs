/**
 * Imports a folder downloaded from Google Drive into content/.
 *
 * This is the manual alternative to fetch-drive-content.mjs. That script needs a
 * Google service account, which is the right answer for an automated pipeline
 * and a lot of setup for a one-time load. This script asks only that you
 * download the folder from Drive in a browser, unzip it, and point this at it.
 *
 * It does the three things that are easy to get wrong by hand:
 *   - sorts L files into content/learning and Q files into content/quiz
 *   - applies the renames recorded in drive-manifest.json, so the two modules
 *     that share the L09 number land as L09a and L09b
 *   - skips the duplicate upload rather than letting it overwrite the good copy
 *
 * Usage:
 *   node apps/api/src/scripts/import-drive-download.mjs ~/Downloads/JSONFILES_CodeWithoutLimitsNET
 *   node apps/api/src/scripts/import-drive-download.mjs ~/Downloads/JSONFILES_CodeWithoutLimitsNET --write
 *
 * Without --write it only reports what it would do. Nothing is changed.
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = resolve(here, '../../../../content');

const args = process.argv.slice(2);
const write = args.includes('--write');
const sourceArg = args.find((a) => !a.startsWith('--'));

if (!sourceArg) {
  console.error('Point this at the folder you downloaded and unzipped, for example:');
  console.error('  node apps/api/src/scripts/import-drive-download.mjs ~/Downloads/JSONFILES_CodeWithoutLimitsNET');
  process.exit(1);
}

const sourceDir = resolve(sourceArg.replace(/^~/, process.env.HOME ?? '~'));

let manifest;
try {
  manifest = JSON.parse(await readFile(join(contentDir, 'drive-manifest.json'), 'utf8'));
} catch {
  console.error(`Could not read ${join(contentDir, 'drive-manifest.json')}.`);
  console.error('Run this from inside the repository.');
  process.exit(1);
}

let available;
try {
  available = (await readdir(sourceDir)).filter((n) => n.toLowerCase().endsWith('.json'));
} catch {
  console.error(`Could not open ${sourceDir}.`);
  console.error('Check the path. If the folder name has spaces, wrap it in quotes.');
  process.exit(1);
}

console.log(`Reading from ${sourceDir}`);
console.log(`Found ${available.length} JSON file(s).\n`);

/**
 * Browsers rename a second copy of the same filename to "name (1).json".
 * Match the exact name first, then fall back to that pattern so a download
 * containing both copies of Q02 still resolves cleanly.
 */
function findCandidate(wanted) {
  const exact = available.find((n) => n === wanted);
  if (exact) return exact;
  const stem = wanted.replace(/\.json$/i, '');
  const numbered = available.filter((n) =>
    new RegExp(`^${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\(\\d+\\)\\.json$`, 'i').test(n)
  );
  return numbered[0] ?? null;
}

const planned = [];
const missing = [];

for (const entry of manifest.files) {
  const found = findCandidate(entry.name);
  if (!found) {
    missing.push(entry.name);
    continue;
  }

  let parsed;
  try {
    parsed = JSON.parse(await readFile(join(sourceDir, found), 'utf8'));
  } catch (err) {
    console.error(`  ${found}: not valid JSON (${err.message}). Skipping.`);
    continue;
  }

  if (entry.moduleId && parsed.module_id && parsed.module_id !== entry.moduleId) {
    console.warn(
      `  ${found}: module_id is "${parsed.module_id}" but the manifest expects "${entry.moduleId}". Importing anyway.`
    );
  }

  planned.push({ from: found, to: entry.target, renamed: Boolean(entry.renamed), data: parsed });
}

for (const plan of planned) {
  const flag = plan.renamed ? '  (renamed to avoid a collision)' : '';
  console.log(`  ${plan.from}  ->  content/${plan.to}${flag}`);
}

if (manifest.skipped?.length) {
  console.log('\nDeliberately not imported:');
  for (const s of manifest.skipped) console.log(`  ${s.name} - ${s.reason}`);
}

if (missing.length) {
  console.log('\nExpected but not found in the download:');
  for (const name of missing) console.log(`  ${name}`);
  console.log('  These may simply not exist yet. Nothing is broken by their absence.');
}

if (!write) {
  console.log(`\nDry run. ${planned.length} file(s) would be imported.`);
  console.log('Re-run with --write at the end of the command to actually copy them.');
  process.exit(0);
}

await mkdir(join(contentDir, 'learning'), { recursive: true });
await mkdir(join(contentDir, 'quiz'), { recursive: true });

for (const plan of planned) {
  await writeFile(join(contentDir, plan.to), `${JSON.stringify(plan.data, null, 2)}\n`, 'utf8');
}

console.log(`\nImported ${planned.length} file(s) into content/.`);
console.log('\nNext, from the repository root:');
console.log('  npm run validate:content');
console.log('  node apps/api/src/scripts/merge-catalogue.mjs --durations-only --write');
