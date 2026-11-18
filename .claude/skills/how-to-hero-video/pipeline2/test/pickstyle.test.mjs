// node --test test/
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pickStyle } from '../pickstyle.mjs';
import { kits, loadFlow, flowErrors } from '../flow.mjs';

const REG = kits(loadFlow()); // registry facts + weight and status from flow.json
const kit = (slug, o = {}) => ({ slug, status: 'core', formats: ['short', 'doc'], fit: { kinds: [], topics: [] }, weight: 1, pairsWith: [], ...o });
const ids = n => Array.from({ length: n }, (_, i) => 'id-' + i);
const share = (reg, slug, opts) => ids(1000).filter(id => pickStyle({ id }, reg, opts).primary === slug).length / 1000;

test('registry: 5 kits, each with what the picker and verify.py read', () => {
  assert.equal(REG.length, 5);
  for (const k of REG) {
    assert.ok(['trial', 'core', 'accent-only', 'retired'].includes(k.status), k.slug);
    assert.ok(['light', 'dark'].includes(k.luma), k.slug);
    assert.match(k.paper, /^#[0-9a-f]{6}$/i, k.slug);
    assert.ok(fs.existsSync(new URL(`../styles/${k.slug}/kit.js`, import.meta.url)), k.slug + '/kit.js');
    assert.ok(k.formats.length && k.weight > 0 && Array.isArray(k.pairsWith) && Array.isArray(k.fit.kinds) && Array.isArray(k.fit.topics), k.slug);
  }
});

test('the same id always gets the same style, and ids spread over several styles', () => {
  const picks = ids(200).map(id => pickStyle({ id, kind: 'explainer' }, REG).primary);
  assert.deepEqual(picks, ids(200).map(id => pickStyle({ id, kind: 'explainer' }, REG).primary));
  assert.ok(new Set(picks).size >= 3);
  for (const p of picks) assert.ok(REG.some(k => k.slug === p));
});

test('the card decides when it names a style', () => {
  assert.deepEqual(pickStyle({ id: 'a', data: { style: 'chalkboard' } }, REG), { primary: 'chalkboard' });
  assert.deepEqual(pickStyle({ id: 'a', data: { style: { primary: 'blueprint', accent: 'whiteboard' } } }, REG), { primary: 'blueprint', accent: 'whiteboard' });
  assert.deepEqual(pickStyle({ id: 'a', series: 'NEWS', data: { style: 'chalkboard' } }, REG, { seriesLock: { NEWS: 'blueprint' } }), { primary: 'chalkboard' });
});

test('"classic" and retired styles on the card fall through to a normal pick; an unknown slug is an error', () => {
  const normal = pickStyle({ id: 'a' }, REG);
  assert.deepEqual(pickStyle({ id: 'a', data: { style: 'classic' } }, REG), normal);
  assert.throws(() => pickStyle({ id: 'a', data: { style: 'blueprnt' } }, REG), /"blueprnt", which is not in the registry/);
  assert.throws(() => pickStyle({ id: 'a', data: { style: { primary: 'blueprint', accent: 'nope' } } }, REG), /"nope"/);
  const reg = [kit('old', { status: 'retired' }), kit('new')];
  assert.deepEqual(pickStyle({ id: 'a', data: { style: 'old' } }, reg), { primary: 'new' });
  assert.deepEqual(pickStyle({ id: 'a', series: 'S' }, reg, { seriesLock: { S: 'old' } }), { primary: 'new' });
});

test('a series lock wins over the weighted pick', () => {
  for (const id of ids(20)) assert.deepEqual(pickStyle({ id, series: 'NEWS' }, REG, { seriesLock: { NEWS: 'blueprint' } }), { primary: 'blueprint' });
  assert.equal(pickStyle({ id: 'id-3', series: 'OTHER' }, REG, { seriesLock: { NEWS: 'blueprint' } }).primary, pickStyle({ id: 'id-3' }, REG).primary);
});

test('format, kind and topic narrow the pick', () => {
  const noDoc = REG.filter(k => !k.formats.includes('doc')).map(k => k.slug);
  assert.ok(noDoc.length);
  for (const id of ids(200)) assert.ok(!noDoc.includes(pickStyle({ id, format: 'doc' }, REG).primary));
  const reg = [kit('a', { fit: { kinds: ['news'], topics: ['space'] } }), kit('b', { fit: { kinds: ['explainer'], topics: ['nature'] } }), kit('c', { fit: { kinds: ['explainer'], topics: ['space'] } })];
  for (const id of ids(50)) {
    assert.equal(pickStyle({ id, kind: 'news' }, reg).primary, 'a');
    assert.equal(pickStyle({ id, kind: 'explainer', topics: ['nature'] }, reg).primary, 'b');
    assert.equal(pickStyle({ id, data: { kind: 'explainer', topics: ['space'] } }, reg).primary, 'c');
    assert.notEqual(pickStyle({ id, kind: 'explainer', topics: ['cooking'] }, reg).primary, 'a'); // no topic match: any kit of that kind
  }
  assert.throws(() => pickStyle({ id: 'x', kind: 'recipe' }, reg), /no core or trial kit fits/);
});

test('about 1 pick in 5 goes to a trial kit, and trialShare changes that', () => {
  const reg = [kit('live'), kit('new', { status: 'trial' })];
  const s = share(reg, 'new');
  assert.ok(s > 0.14 && s < 0.26, `trial share ${s}`);
  assert.equal(share(reg, 'new', { trialShare: 0 }), 0);
  assert.equal(share(reg, 'new', { trialShare: 1 }), 1);
  assert.equal(share([kit('new', { status: 'trial' })], 'new', { trialShare: 0 }), 1); // only trial kits: they are used
  assert.equal(share([kit('live'), kit('gone', { status: 'retired' }), kit('acc', { status: 'accent-only' })], 'live', { trialShare: 1 }), 1);
});

test('weights shift the pick, and the floor keeps every kit in play', () => {
  const even = share([kit('a'), kit('b')], 'a'), heavy = share([kit('a', { weight: 9 }), kit('b')], 'a');
  assert.ok(even > 0.42 && even < 0.58, `even ${even}`);
  assert.ok(heavy > 0.85 && heavy < 0.95, `heavy ${heavy}`);
  assert.equal(share([kit('a', { weight: 0 }), kit('b')], 'a'), 0);
  const floored = share([kit('a', { weight: 0 }), kit('b')], 'a', { floor: 0.1 });
  assert.ok(floored > 0.05 && floored < 0.15, `floored ${floored}`);
});

test('flow.json is valid, and a broken one is explained', () => {
  const flow = loadFlow();
  assert.deepEqual(flowErrors(flow), []);
  const bad = structuredClone(flow);
  bad.build.paused = 'no'; bad.style.kits.whiteboard.status = 'active'; bad.style.kits.nope = { weight: 1, status: 'trial' }; bad.style.colour = 1;
  const e = flowErrors(bad).join('\n');
  for (const r of [/build\.paused/, /whiteboard\.status/, /style\.kits\.nope: no such kit/, /style\.colour is not a known setting/]) assert.match(e, r);
});

test('an accent kit is offered only for chart, map or timeline beats and a listed partner', () => {
  const reg = [kit('main', { pairsWith: ['gone', 'data'] }), kit('data', { status: 'accent-only' }), kit('gone', { status: 'retired' })];
  assert.deepEqual(pickStyle({ id: 'a' }, reg, { intents: ['object', 'chart'] }), { primary: 'main', accent: 'data' });
  assert.deepEqual(pickStyle({ id: 'a' }, reg, { intents: ['object', 'process'] }), { primary: 'main' });
  assert.deepEqual(pickStyle({ id: 'a' }, reg), { primary: 'main' });
  assert.deepEqual(pickStyle({ id: 'a', data: { style: 'main' } }, reg, { intents: ['map'] }), { primary: 'main', accent: 'data' });
  for (const id of ids(50)) assert.equal(pickStyle({ id }, REG, { intents: ['chart', 'map', 'timeline'] }).accent, undefined); // no kit has a partner yet
});
