import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeResponses } from '../src/services/grading.service.js';

const key = new Map([
  ['Q-1', { answer: 'B', bloom: 'L1', options: { A: 'a', B: 'b', C: 'c', D: 'd' }, stem: 's', explanation: 'e', source: '' }],
  ['Q-2', { answer: 'C', bloom: 'L2', options: { A: 'a', B: 'b', C: 'c', D: 'd' }, stem: 's', explanation: 'e', source: '' }],
  ['Q-3', { answer: 'A', bloom: 'L3', options: { A: 'a', B: 'b', C: 'c', D: 'd' }, stem: 's', explanation: 'e', source: '' }]
]);
const issued = ['Q-1', 'Q-2', 'Q-3'];

test('scores correct and incorrect responses', () => {
  const result = gradeResponses({
    issuedQuestionIds: issued,
    submitted: [
      { q_id: 'Q-1', selected: 'B' },
      { q_id: 'Q-2', selected: 'A' },
      { q_id: 'Q-3', selected: 'A' }
    ],
    key
  });
  assert.equal(result.score, 2);
  assert.equal(result.total, 3);
  assert.equal(result.passed, false);
  assert.equal(result.bloomBreakdown.L1.correct, 1);
  assert.equal(result.bloomBreakdown.L2.correct, 0);
});

test('unanswered issued questions still count toward the denominator', () => {
  const result = gradeResponses({
    issuedQuestionIds: issued,
    submitted: [{ q_id: 'Q-1', selected: 'B' }],
    key
  });
  assert.equal(result.total, 3);
  assert.equal(result.percentage, 33.3);
});

test('rejects a question that was not issued for this attempt', () => {
  assert.throws(
    () => gradeResponses({ issuedQuestionIds: issued, submitted: [{ q_id: 'Q-99', selected: 'A' }], key }),
    /was not part of this attempt/
  );
});

test('rejects a duplicate answer for the same question', () => {
  assert.throws(
    () =>
      gradeResponses({
        issuedQuestionIds: issued,
        submitted: [
          { q_id: 'Q-1', selected: 'A' },
          { q_id: 'Q-1', selected: 'B' }
        ],
        key
      }),
    /answered more than once/
  );
});

test('rejects an option letter the question does not offer', () => {
  assert.throws(
    () => gradeResponses({ issuedQuestionIds: issued, submitted: [{ q_id: 'Q-1', selected: 'H' }], key }),
    /is not an option/
  );
});
