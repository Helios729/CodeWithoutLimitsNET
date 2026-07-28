TERRACOTTA PALETTE + ACCESSIBLE ERROR STATES — DROP-IN FILES
============================================================

These four files replace their counterparts in your Codespace project.
The folder structure here matches your project exactly, so you can drop
the folders in and let them overwrite.

FILES AND WHERE THEY GO (all paths relative to your project root,
/workspaces/CodeWithoutLimitsNET/):

  1. packages/tokens/src/tokens.json      <- the terracotta palette
  2. apps/web/src/components/Icons.jsx     <- NEW file (status icons)
  3. apps/web/src/components/Bits.jsx      <- error notices now show icons
  4. apps/web/src/pages/QuizRunner.jsx     <- quiz feedback now shows icons

HOW TO DROP THEM IN (Codespace, drag-and-drop):
  - In the Codespace file explorer on the left, open each folder above
    and drag the matching file in, choosing "Replace" when asked.
  - Icons.jsx is brand new; drag it into apps/web/src/components/.

THEN, from the project root, rebuild the tokens and the site:
  npm run tokens:build
  npm run build:web

THEN commit and push:
  git add .
  git commit -m "Apply terracotta palette and colour-blind-safe error states"
  git push

THEN on Render:
  Static Site (codewithoutlimitsnet-1) -> Manual Deploy
    -> Clear build cache & deploy

Refresh codewithoutlimits.net and it will be terracotta and sage.
The backend does not change, so leave it alone.
