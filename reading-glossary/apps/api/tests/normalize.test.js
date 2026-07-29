import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { normaliseBloom, normaliseQuiz } from '../src/schemas/normalize.js';
import { quizModuleSchema } from '../src/schemas/content.schema.js';

const contentDir = resolve(import.meta.dirname, '../../../content');

test('bloom labels shorten to bare codes in both dialects', () => {
  assert.equal(normaliseBloom('L1 Remember'), 'L1');
  assert.equal(normaliseBloom('L2 Understand'), 'L2');
  assert.equal(normaliseBloom('L3 Apply'), 'L3');
  assert.equal(normaliseBloom('L1'), 'L1');
  assert.equal(normaliseBloom('  l2 understand  '), 'L2');
});

test('a Q03-dialect file normalises into the canonical shape', async () => {
  const raw = JSON.parse(
    await readFile(join(contentDir, 'quiz', 'Q03_ai_ethics_and_responsible_use.json'), 'utf8')
  );

  // The file as authored has no difficulty, no totals and no table of contents.
  assert.equal(raw.difficulty, undefined);
  assert.equal(raw.totals, undefined);
  assert.equal(raw.table_of_contents, undefined);

  const { quiz, notes } = normaliseQuiz(raw, { difficulty: 'Intermediate' });

  assert.equal(quiz.difficulty, 'Intermediate');
  assert.equal(quiz.totals.questions, 20);
  assert.equal(quiz.totals.mini_quizzes, 4);
  assert.equal(quiz.table_of_contents.length, 4);
  assert.deepEqual(quiz.superquiz_pool, ['A', 'B', 'C', 'D']);
  assert.equal(quiz.total_questions, undefined, 'the alias field is removed once folded into totals');
  assert.ok(notes.length > 0, 'inferred fields are reported rather than applied silently');

  const parsed = quizModuleSchema.safeParse(quiz);
  assert.ok(parsed.success, parsed.error?.issues?.[0]?.message);

  for (const mq of parsed.data.mini_quizzes) {
    for (const q of mq.questions) {
      assert.match(q.bloom, /^L[1-6]$/, `${q.q_id} kept a long-form Bloom label`);
    }
  }
});

test('a quiz with no difficulty anywhere is rejected rather than guessed at', () => {
  assert.throws(
    () =>
      normaliseQuiz(
        { module_id: 'x', module_title: 'X-Q', type: 'quiz', mini_quizzes: [] },
        {}
      ),
    /no difficulty/
  );
});

test('every quiz file in content/ validates after normalisation', async () => {
  const { readdir } = await import('node:fs/promises');
  const dir = join(contentDir, 'quiz');
  const names = (await readdir(dir)).filter((n) => n.endsWith('.json'));

  const catalogue = JSON.parse(await readFile(join(contentDir, 'catalogue.json'), 'utf8'));
  const difficulty = new Map(catalogue.map((e) => [e.id, e.difficulty]));

  for (const name of names) {
    const raw = JSON.parse(await readFile(join(dir, name), 'utf8'));
    const { quiz } = normaliseQuiz(raw, { difficulty: difficulty.get(raw.module_id) });
    const parsed = quizModuleSchema.safeParse(quiz);
    assert.ok(parsed.success, `${name}: ${parsed.error?.issues?.[0]?.message ?? ''}`);
  }
});
