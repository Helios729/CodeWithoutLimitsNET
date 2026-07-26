# Code Without Limits

Dual-platform learning asset for **codewithoutlimits.net**: a React website on Netlify, an Expo
app for iOS and Android, and a shared Express + MongoDB API on Railway. All three consume one
design-token package, so the brand is defined once and re-themed by swapping values rather than
rewriting components.

A programme of Mondial Connections and Community Changers.

## Repository layout

```
packages/tokens/     Desert Modernism design tokens (single source of truth)
apps/api/            Express + Mongoose API            -> Railway
apps/web/            React + Vite website              -> Netlify
apps/mobile/         Expo app for iOS and Android      -> EAS Build
content/             Authored lesson and quiz JSON     -> ingested into MongoDB
```

## Prerequisites

Node 20 or newer, npm 10 or newer, and a MongoDB instance (local, Atlas, or the Railway MongoDB
plugin).

## Getting started

```bash
git clone <your-repo-url> code-without-limits
cd code-without-limits
npm install

# Generate CSS variables and type definitions from the token source
npm run tokens:build

# API configuration
cp apps/api/.env.example apps/api/.env
openssl rand -base64 48        # paste into JWT_ACCESS_SECRET
openssl rand -base64 48        # paste into JWT_REFRESH_SECRET (must differ)

# Website configuration
cp apps/web/.env.example apps/web/.env
```

The API refuses to start if either secret is missing or still holds its placeholder value. That
is deliberate: a service that boots with a known signing key is worse than one that does not boot.

## Loading the content

The authored JSON lives in `content/learning` and `content/quiz`. Seven learning modules and one
quiz are already in the repository; the rest are in the shared Drive folder. There are two ways to
bring them in.

### Option A: download from Drive in a browser (simplest)

Best for a one-time load. No Google Cloud setup required.

1. Open the shared folder `JSONFILES_CodeWithoutLimitsNET` in your browser.
2. Select all the files, right-click, and choose Download. Drive sends a `.zip`.
3. Unzip it. On most machines it lands in your Downloads folder.
4. From the repository root, preview the import:

```bash
node apps/api/src/scripts/import-drive-download.mjs ~/Downloads/JSONFILES_CodeWithoutLimitsNET
```

This changes nothing. It prints where each file would go.

5. If the list looks right, run it again with `--write` on the end:

```bash
node apps/api/src/scripts/import-drive-download.mjs ~/Downloads/JSONFILES_CodeWithoutLimitsNET --write
```

The importer sorts `L` files into `learning/` and `Q` files into `quiz/`, applies the renames in
`drive-manifest.json` so the two modules sharing the L09 number land as L09a and L09b, and skips
the duplicate Q02 upload rather than letting it overwrite the good copy.

### Option B: service account (for an automated pipeline)

Worth setting up once the content changes regularly and you want a deploy step to pull it.

1. In Google Cloud, create a project and enable the Drive API.
2. Create a service account and download its JSON key.
3. Share the Drive folder with the service account's email address, viewer access.
4. `npm i -D googleapis`
5. `export GOOGLE_APPLICATION_CREDENTIALS=/secure/path/cwl-drive-sa.json`
6. `node apps/api/src/scripts/fetch-drive-content.mjs`

### After either option

```bash
# Check everything is well-formed. No database needed.
npm run validate:content

# Bring catalogue durations onto the module values for the newly added modules.
node apps/api/src/scripts/merge-catalogue.mjs --durations-only --write

# Write to MongoDB. Add --dry-run first to preview.
npm run ingest
```

Ingestion is idempotent. Each file's SHA-256 is stored and unchanged files are skipped, so this is
safe to run on every deploy.

## Running locally

```bash
npm run dev:api    # http://localhost:4000
npm run dev:web    # http://localhost:5173, proxies /api to the API
npm start -w @cwl/mobile
```

## Tests

```bash
npm test
```

Covers the grading rules, the attempt-integrity checks, and schema validation of every content
file currently in `content/`.

## Deployment

See `DEPLOYMENT.md` for Railway, Netlify, MongoDB Atlas and DNS. See `SECURITY.md` for the threat
model and the reasoning behind each control.
