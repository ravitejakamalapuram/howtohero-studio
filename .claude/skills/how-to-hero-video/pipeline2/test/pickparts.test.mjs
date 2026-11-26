// node --test test/pickparts.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { pickParts, PARTS } from '../pickparts.mjs';
import { loadFlow, flowErrors } from '../flow.mjs';

const P = { trialShare: 0.4, hook: { default: 'claim', trial: ['open-loop', 'number', 'contrast'] },
  opening: { default: 'big-subject', trial: ['in-motion', 'before-after'] }, endCard: { default: 'follow', trial: ['send', 'question'] } };
const ids = Array.from({ length: 2000 }, (_, i) => 'idea-' + i);

test('the same id always gets the same parts', () => {
  assert.deepEqual(pickParts('story-2026-11-26-x', P), pickParts('story-2026-11-26-x', P));
});

const trials = p => Object.entries(PARTS).filter(([name, field]) => p[field] !== P[name].default).length;

test('about trialShare of videos try one part, and never two', () => {
  const got = ids.map(id => pickParts(id, P));
  assert.ok(got.every(p => trials(p) <= 1));
  assert.ok(Math.abs(got.filter(p => trials(p) === 1).length / ids.length - 0.4) < 0.04);
});

test('the hook is tried twice as often as the other parts, over all its trial shapes', () => {
  const got = ids.map(id => pickParts(id, P)), n = f => got.filter(f).length / ids.length;
  assert.ok(Math.abs(n(p => p.hookPattern !== 'claim') - 0.2) < 0.03);
  assert.ok(Math.abs(n(p => p.opening !== 'big-subject') - 0.1) < 0.03);
  assert.ok(Math.abs(n(p => p.endCard !== 'follow') - 0.1) < 0.03);
  for (const v of P.hook.trial) assert.ok(n(p => p.hookPattern === v) > 0.04, v);
});

test('a value the card names wins; an unknown one is ignored', () => {
  assert.equal(pickParts('a', P, { hookPattern: 'number' }).hookPattern, 'number');
  assert.equal(pickParts('a', P, { endCard: 'nonsense' }).endCard, pickParts('a', P).endCard);
});

test('trialShare 0 gives every video the defaults', () => {
  assert.ok(ids.every(id => pickParts(id, { ...P, trialShare: 0 }).hookPattern === 'claim'));
});

test('flow.json parts are valid, and a broken one is caught', () => {
  const flow = loadFlow();
  assert.deepEqual(flowErrors(flow), []);
  const bad = structuredClone(flow); bad.parts.hook.trial.push(bad.parts.hook.default);
  assert.ok(flowErrors(bad).some(m => m.includes('parts.hook')));
  const none = structuredClone(flow); delete none.parts.endCard;
  assert.ok(flowErrors(none).some(m => m.includes('parts.endCard')));
});
