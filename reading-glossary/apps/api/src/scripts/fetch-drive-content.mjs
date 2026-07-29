/**
 * Pulls the authored JSON out of the shared Google Drive folder into content/.
 *
 * Authentication uses a Google service account, not an OAuth user session.
 * A service-account key can be scoped to drive.readonly and revoked centrally,
 * and it does not tie the deploy pipeline to one person's login.
 *
 * Setup, once:
 *   1. In Google Cloud, create a service account and enable the Drive API.
 *   2. Download its JSON key.
 *   3. Share the Drive folder with the service account's email, viewer access.
 *   4. Export the key path:
 *        export GOOGLE_APPLICATION_CREDENTIALS=/secure/path/cwl-drive-sa.json
 *      On Railway, paste the key JSON into a variable named
 *      GOOGLE_SERVICE_ACCOUNT_JSON instead of shipping a file.
 *
 * Usage:
 *   node apps/api/src/scripts/fetch-drive-content.mjs
 *   node apps/api/src/scripts/fetch-drive-content.mjs --verify   (checksums only)
 *
 * Requires: npm i -D googleapis
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = resolve(here, '../../../../content');
const verifyOnly = process.argv.includes('--verify');

const manifest = JSON.parse(await readFile(join(contentDir, 'drive-manifest.json'), 'utf8'));

async function getDriveClient() {
  const { google } = await import('googleapis');

  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const auth = inline
    ? new google.auth.GoogleAuth({
        credentials: JSON.parse(inline),
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
      })
    : new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/drive.readonly'] });

  return google.drive({ version: 'v3', auth: await auth.getClient() });
}

async function download(drive, fileId) {
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' });
  return typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
}

const drive = await getDriveClient();
await mkdir(join(contentDir, 'learning'), { recursive: true });
await mkdir(join(contentDir, 'quiz'), { recursive: true });

let written = 0;
let failed = 0;

for (const entry of manifest.files) {
  const destination = join(contentDir, entry.target);
  try {
    const raw = await download(drive, entry.id);

    // Parse before writing. A truncated download that still looks like text
    // would otherwise land in content/ and only fail later, at ingest time.
    const parsed = JSON.parse(raw);
    if (parsed.module_id && entry.moduleId && parsed.module_id !== entry.moduleId) {
      console.warn(
        `  ${entry.name}: module_id is "${parsed.module_id}" but the manifest expects "${entry.moduleId}"`
      );
    }

    const pretty = `${JSON.stringify(parsed, null, 2)}\n`;
    if (verifyOnly) {
      console.log(`  ${entry.target}  sha256=${createHash('sha256').update(pretty).digest('hex').slice(0, 16)}`);
    } else {
      await writeFile(destination, pretty, 'utf8');
      console.log(`  wrote ${entry.target}`);
      written += 1;
    }
  } catch (err) {
    failed += 1;
    console.error(`  FAILED ${entry.name}: ${err.message}`);
  }
}

console.log(`\n${verifyOnly ? 'Verified' : 'Wrote'} ${verifyOnly ? manifest.files.length : written} file(s); ${failed} failure(s).`);
if (manifest.gaps?.length) {
  console.log('\nKnown content gaps recorded in the manifest:');
  for (const gap of manifest.gaps) console.log(`  - ${gap.missing}: ${gap.impact}`);
}
process.exit(failed ? 1 : 0);
