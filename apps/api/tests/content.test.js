import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { learningModuleSchema, questionSchema } from '../src/schemas/content.schema.js';

const contentDir = resolve(import.meta.dirname, '../../../content');

test('every learning file in content/ validates', async () => {
  const dir = join(contentDir, 'learning');
  const names = (await readdir(dir)).filter((n) => n.endsWith('.json'));
  assert.ok(names.length > 0, 'expected at least one learning module');

  for (const name of names) {
    const data = JSON.parse(await readFile(join(dir, name), 'utf8'));
    const parsed = learningModuleSchema.safeParse(data);
    assert.ok(parsed.success, `${name}: ${parsed.error?.issues?.[0]?.message ?? ''}`);
  }
});

test('a question whose answer key points at a missing option is rejected', () => {
  const broken = {
    q_id: 'X-1',
    bloom: 'L1',
    stem: 'Which one?',
    options: { A: 'first', B: 'second' },
    answer: 'D'
  };
  assert.equal(questionSchema.safeParse(broken).success, false);
});
