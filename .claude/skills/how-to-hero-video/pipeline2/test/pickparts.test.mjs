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

test('about trialShare of videos get a trial value, spread over the trial values', () => {
  for (const [name, field] of Object.entries(PARTS)) {
    const got = ids.map(id => pickParts(id, P)[field]);
    const trial = got.filter(v => v !== P[name].default).length / ids.length;
    assert.ok(Math.abs(trial - 0.4) < 0.05, `${name}: ${trial}`);
    for (const v of P[name].trial) assert.ok(got.filter(x => x === v).length > ids.length * 0.4 / P[name].trial.length * 0.7, `${name} ${v}`);
  }
});

test('the parts are drawn separately', () => {
  const both = ids.filter(id => { const p = pickParts(id, P); return p.hookPattern !== 'claim' && p.endCard !== 'follow'; }).length / ids.length;
  assert.ok(Math.abs(both - 0.16) < 0.04, String(both));
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
