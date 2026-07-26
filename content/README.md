# Content

Authored course material. This directory is the source of truth; MongoDB is a projection of it.

```
content/
  catalogue.json           Marketing copy, ordering and pricing per module
  drive-manifest.json      File ids and targets for the shared Drive folder
  learning/                One "-L" file per module
  quiz/                    One "-Q" file per module
```

## File naming

A numeric prefix orders the curriculum. A letter suffix distinguishes sibling modules that sit at
the same point in the sequence.

| File | Module |
|---|---|
| `L09a_robotics.json` | `robotics-and-autonomous-systems` |
| `L09b_ai_in_society_and_the_future.json` | `ai-in-society-and-the-future` |
| `L10a_generative_ai.json` | `generative-ai-and-llms` |
| `L10b_beg_html.json`, `L10b_int_html.json`, `L10b_adv_html.json` | the three HTML modules |

File names are for humans. Ingestion reads every `*.json` in `learning/` and `quiz/` and keys off
`module_id`, so renaming a file changes nothing about what is stored, what a URL resolves to, or
what a learner's saved progress points at.

## Pairing rule

A module is only fully usable when `learning/<module>.json` and `quiz/<module>.json` share the same
`module_id`. The ingest script reports any module without a companion quiz, because a course with
a dead "Take the quiz" button is a worse experience than a course that is not listed yet.

## Two quiz dialects

The corpus contains two legitimate quiz shapes and both are supported. Nothing in `content/` is
rewritten to force one shape; `apps/api/src/schemas/normalize.js` reconciles them on the way into
the database.

| | Canonical (Q01) | Compact (Q03) |
|---|---|---|
| Bloom values | `L1` | `L1 Remember` |
| `difficulty` | present | inherited from the learning module, then the catalogue |
| Question count | `totals.questions` | `total_questions` |
| `skill`, `source_lesson` | present | derived or blank |
| `superquiz_pool`, `bloom_distribution`, `table_of_contents` | present | generated from the questions |

Every field the normaliser has to infer is printed during ingestion, so a guess is always visible
rather than silent.

## Current gaps

Read from the shared Drive folder on 23 July 2026. Q03 (AI Ethics quiz) was not reachable there
and has since been supplied directly; it is now in `content/quiz/`. Recorded here so they are visible rather than
discovered at ingest time.

| Gap | Effect |
|---|---|
| No quiz for `algorithms-and-data-structures` | Module L04 has lessons but no quiz |
| No quiz for `robotics-and-autonomous-systems` | Module L09a has lessons but no quiz |
| No quiz for `ai-in-society-and-the-future` | Module L09b has lessons but no quiz |
| No lesson files for `computer-vision`, `ai-in-healthcare`, `ai-in-business` | Q08, Q09 and Q10 are quizzes with no course to sit under |
| `Q02_edtech.json` uploaded twice | The older copy is skipped by the manifest |
| `catalogue.json` lists 9 modules | `ai-in-society-and-the-future`, `generative-ai-and-llms` and the three HTML modules ingest with no marketing copy |

Modules with lessons but no quiz still ingest and are readable. They simply do not offer an
assessment until the quiz file arrives.

## Catalogue copy

`catalogue.json` supplies the tagline, description, `what_you_learn` list, thumbnail and price for
each module. A module without an entry still ingests and reads correctly; its card simply has no
copy on it.

Order matters. `ingest.js` assigns each module an `order` from its index in this file, and that
value drives display order in both the app and on the website. Inserting an entry in the wrong
place reshuffles the catalogue for every learner, which is why merging is scripted rather than
done by hand.

House style, measured from the original nine entries:

- **Tagline** one sentence, active voice, addressed to the learner.
- **Description** a single paragraph, roughly 60 to 120 words, opening with a plain definition of
  the subject and closing with sources where the module cites them.
- **what_you_learn** exactly six items, ascending through Bloom's levels: define, identify,
  explain, compare, then an analyse or evaluate verb, then apply.
- **Spelling** American, which is what the existing entries use. The module JSON files use British
  spelling; the two do not need to match, since they are read in different places.

Draft entries for modules that have no copy yet live in `catalogue-additions.draft.json`. Edit
them there, then merge:

```bash
node apps/api/src/scripts/merge-catalogue.mjs            # dry run, shows what would change
node apps/api/src/scripts/merge-catalogue.mjs --write    # applies, backs up the previous file
```

The merge validates every draft, refuses to overwrite an id that already exists, and places entries
in curriculum sequence.

### Duration is owned by the module file

`ingest.js` spreads the validated module document, and the marketing overrides do not include
`duration_min`. The module file therefore decides what a learner sees, and a catalogue entry that
disagrees is stating a number the product never reads.

Three original entries disagreed and have been corrected onto the module values: neural networks
and robotics from 105 to 90 minutes, natural language processing from 100 to 90. The linter now
fails on any new drift, and the fix is scripted:

```bash
node apps/api/src/scripts/merge-catalogue.mjs --durations-only            # dry run
node apps/api/src/scripts/merge-catalogue.mjs --durations-only --write    # applies
```

`--durations-only` deliberately adds no draft entries, so a number can be corrected without forcing
a decision about copy that is still being edited.

Six catalogue entries cannot be checked yet because their module files are still in Drive:
introduction to AI, EdTech, AI ethics, algorithms, Python, and machine learning. Run the Drive
fetch, then re-run the command above to reconcile those too.

## Adding a module

1. Write `learning/<n>_<slug>.json` and `quiz/<n>_<slug>.json` with a matching `module_id`.
2. Add a catalogue entry with the same `id` so the card carries a tagline and description.
3. Run `npm run validate:content`, then `npm run ingest`.

## Quiz authoring rules the linter enforces

- `answer` must name a key that exists in `options`.
- Every `q_id` must be unique across the entire corpus.
- `totals.questions` must match the number of questions actually present.
- `table_of_contents` `q_ids` must match the questions in that mini-quiz, in order.
