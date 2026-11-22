// node --test test/
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { validateVideo, validateScenes, findWord, ROLES, INTENTS, ACCENT_INTENTS, ICONS, KINDS, SHOT, STYLES } from '../schema.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const video = (o = {}) => ({
  id: 't1', file: 't1.mp4',
  beats: [{ say: 'Hubble is slowly falling, and the drag makes it fall faster.' }, { say: 'Thin air steals speed.' }, { hold: 1.6 }],
  card: { lines: ['FOLLOW FOR HOW THINGS WORK,', 'IN A MINUTE.'] }, ...o,
});
const scenes = (...items) => ({ beats: [{ beat: 1, intent: 'object', items }] });
const has = (errs, re) => assert.ok(errs.some(e => re.test(e)), `no error matching ${re} in ${JSON.stringify(errs)}`);
const bad = (item, re) => has(validateScenes(scenes(item), video()), re);
const good = item => assert.deepEqual(validateScenes(scenes(item), video()), []);

test('vocabularies', () => {
  assert.deepEqual(ROLES, ['ink', 'accent', 'warn', 'good', 'muted', 'paper']);
  assert.equal(INTENTS.length, 12);
  for (const i of ACCENT_INTENTS) assert.ok(INTENTS.includes(i));
  assert.ok(ICONS.includes('hero') && ICONS.includes('hubble'));
  for (const k of ['text', 'num', 'hl', 'line', 'arrow', 'circle', 'ell', 'rect', 'icon', 'move', 'dim', 'mk', 'banner', 'label', 'bars', 'box', 'tower', 'slab', 'dishsite', 'link', 'iplane', 'custom']) assert.ok(KINDS[k], k);
});

test('findWord: case and punctuation are ignored; #n picks the n-th time; +s and -s shift', () => {
  const say = 'Hubble is slowly falling, and the drag makes it fall faster. Falling!';
  assert.deepEqual(findWord(say, 'word:hubble'), { i: 0, off: 0 });
  assert.deepEqual(findWord(say, 'word:FALLING'), { i: 3, off: 0 });
  assert.deepEqual(findWord(say, 'word:falling#2'), { i: 11, off: 0 });
  assert.deepEqual(findWord(say, 'word:drag+0.3'), { i: 6, off: 0.3 });
  assert.deepEqual(findWord(say, 'word:drag-0.2'), { i: 6, off: -0.2 });
  assert.deepEqual(findWord(say, 'word:falling#2+1'), { i: 11, off: 1 });
  assert.equal(findWord(say, 'word:moon'), null);
  assert.equal(findWord(say, 'word:falling#3'), null);
  assert.equal(findWord(say, 'falling'), null);
  assert.deepEqual(findWord('the covid-19 wave hit', 'word:covid-19'), { i: 1, off: 0 }); // a word with a hyphen and digits, not an offset
});

test('video: a minimal video passes, with or without the optional parts', () => {
  assert.deepEqual(validateVideo(video()), []);
  assert.deepEqual(validateVideo(video({ format: 'doc', style: { primary: 'blueprint', accent: 'whiteboard' }, hook: { lines: ['HUBBLE IS', 'FALLING.'], accent: 'FALLING' }, topic: 'SPACE', kind: 'news', topics: ['space'], series: 'NEWS' })), []);
  assert.deepEqual(validateVideo(video({ audio: { file: 'a.m4a', starts: [0.4, 7.9, 12] } })), []);
  assert.deepEqual(validateVideo(video({ beats: [{ say: 'One two.', words: [['One', 0.4], ['two.', 0.9]] }, { say: 'Follow for more.' }] })), []);
});

test('video: each broken field is reported', () => {
  has(validateVideo(video({ id: '' })), /^id/);
  has(validateVideo(video({ file: 't1.mov' })), /^file/);
  has(validateVideo(video({ format: 'square' })), /^format/);
  has(validateVideo(video({ style: {} })), /^style/);
  has(validateVideo(video({ hook: { lines: ['A', 'B', 'C'] } })), /^hook\.lines/);
  has(validateVideo(video({ hook: { lines: [] } })), /^hook\.lines/);
  has(validateVideo(video({ card: undefined })), /^card\.lines/);
  has(validateVideo(video({ card: { lines: [] } })), /^card\.lines/);
  has(validateVideo(video({ card: { lines: ['1', '2', '3', '4'] } })), /^card\.lines/);
  has(validateVideo(video({ beats: [{ say: 'Only one.' }] })), /^beats/);
  has(validateVideo(video({ beats: [{ say: 'One.' }, { hold: 1 }, { hold: 1.6 }] })), /^beats\[2\]/);
  has(validateVideo(video({ beats: [{ say: 'One two.', words: [['One', 0.4]] }, { hold: 1.6 }] })), /^beats\[1\]\.words/);
});

test('video: audio needs a file and one rising start time per beat', () => {
  has(validateVideo(video({ audio: { starts: [0.4, 7.9, 12] } })), /^audio\.file/);
  has(validateVideo(video({ audio: { file: 'a.m4a', starts: [0.4, 7.9] } })), /^audio\.starts/);
  has(validateVideo(video({ audio: { file: 'a.m4a', starts: [0.4, 7.9, 7.9] } })), /^audio\.starts/);
  has(validateVideo(video({ audio: { file: 'a.m4a', starts: [0.4, '7.9', 12] } })), /^audio\.starts/);
  has(validateVideo(video({ audio: { file: 'a.m4a' } })), /^audio\.starts/);
});

test('scenes: beats must be content beats, listed once, with a known intent and items', () => {
  const v = video();
  assert.deepEqual(validateScenes({ beats: [] }, v), []);
  has(validateScenes({}, v), /needs "beats"/);
  has(validateScenes({ beats: [{ beat: 3, intent: 'endcard', items: [] }] }, v), /must be 1\.\.2/); // beat 3 is the end card
  has(validateScenes({ beats: [{ beat: 0, intent: 'object', items: [] }] }, v), /must be 1\.\.2/);
  has(validateScenes({ beats: [{ beat: 1, intent: 'object', items: [] }, { beat: 1, intent: 'object', items: [] }] }, v), /listed twice/);
  has(validateScenes({ beats: [{ beat: 1, intent: 'explosion', items: [] }] }, v), /intent must be one of/);
  has(validateScenes({ beats: [{ beat: 1, intent: 'object' }] }, v), /needs "items"/);
});

test('scenes: one valid item of every kind passes', () => {
  for (const it of [
    { k: 'text', txt: 'THIN AIR', x: 0.5, y: 0.6, s: 0.05, role: 'accent', align: 'center', font: 'body' },
    { k: 'num', to: 26500, from: 27000, pre: 'SPEED ', suf: ' km/h', x: 0.5, y: 0.7, s: 0.05 },
    { k: 'hl', x: 0.2, y: 0.8, w: 0.6, h: 0.06 }, { k: 'line', pts: [[0, 0], [1, 1]] }, { k: 'arrow', pts: [[0.2, 0.5], [0.8, 0.5]], hs: 0.03, role: 'warn' },
    { k: 'circle', x: 0.5, y: 0.4, r: 0.1 }, { k: 'ell', x: 0.5, y: 0.4, rx: 0.2, ry: 0.1, rot: 0.3 }, { k: 'rect', x: 0.1, y: 0.8, w: 0.8, h: 0.1 },
    { k: 'icon', name: 'hubble', box: [0.5, 0.5, 0.4] }, { k: 'icon', name: 'sat', x: 0.5, y: 0.5, s: 0.2 }, { k: 'move', icon: 'sat', s: 0.1, path: [[0.1, 0.2], [0.9, 0.2]] },
    { k: 'dim', x1: 0.2, y1: 0.8, x2: 0.8, y2: 0.8, label: 'IN ORBIT' }, { k: 'mk', x: 0.5, y: 0.4, rx: 0.07, ry: 0.07 }, { k: 'mk', x: 0.5, y: 0.4, w: 0.2, h: 0.1 },
    { k: 'banner', x: 0.5, y: 0.06, w: 0.7, txt: 'EVERY LAP' }, { k: 'label', txt: 'CENTER', x: 0.5, y: 0.5 }, { k: 'label', txt: 'CENTER', gx: 0, gy: 0, gz: 0.2 },
    { k: 'bars', x: 0.2, y: 0.8, w: 0.6, h: 0.1, vals: [4, 3, 2], labels: ['a', 'b', 'c'] }, { k: 'box', gx: 0, gy: 0, w: 0.1, dp: 0.1, h: 0.1 }, { k: 'tower', gx: 0, gy: 0, h: 0.1 },
    { k: 'slab', gx: 0, gy: 0, w: 0.5, dp: 0.5 }, { k: 'dishsite', gx: 0.2, gy: 0.2 }, { k: 'link', a: [0, 0, 0], b: [0.2, 0.2, 0], broken: true },
    { k: 'iplane', a: [0, 0, 0.2], b: [0.2, 0.1, 0.2], s: 0.09, fly: 4 }, { k: 'custom', fn: 'spiral', x: 0.5, y: 0.4, r: 0.3, r1: 0.1, turns: 3, sq: 0.6 },
  ]) good(it);
});

test('scenes: every kind reports each required field that is missing', () => {
  for (const [k, need] of Object.entries(KINDS)) for (const f of need) has(validateScenes(scenes({ k }), video()), new RegExp(`\\(${k}\\): missing "${f}"`));
});

test('scenes: item mistakes are reported', () => {
  bad({ k: 'sparkle' }, /unknown kind/);
  bad({ k: 'text', txt: 'A', x: '0.5', y: 0.5, s: 0.05 }, /"x" must be a number/);
  bad({ k: 'text', txt: 'A', x: 0.5, y: 0.5, s: 0.05, role: 'blue' }, /role must be one of/);
  bad({ k: 'text', txt: 'A', x: 0.5, y: 0.5, s: 0.05, c: 'red' }, /"c" is not used/);
  bad({ k: 'line', pts: [[0, 0]] }, /"pts" must be a list/);
  bad({ k: 'move', icon: 'sat', s: 0.1, path: [0.1, 0.2] }, /"path" must be a list/);
  bad({ k: 'link', a: [0, 0], b: [0.2, 0.2, 0] }, /"a" must be \[gx, gy, gz\]/);
  bad({ k: 'icon', name: 'hubble' }, /needs "box"/);
  bad({ k: 'icon', name: 'unicorn', box: [0.5, 0.5, 0.4] }, /unknown icon "unicorn"/);
  bad({ k: 'move', icon: 'unicorn', s: 0.1, path: [[0, 0], [1, 1]] }, /unknown icon "unicorn"/);
  bad({ k: 'custom', fn: 'fireworks' }, /unknown fn "fireworks"/);
  bad({ k: 'mk', x: 0.5, y: 0.4, rx: 0.07 }, /needs rx, ry \(ellipse\) or w, h \(rect\)/);
  bad(null, /must be an object/);
  bad({ k: 'text', txt: 5, x: 0.5, y: 0.5, s: 0.05 }, /"txt" must be text/);
  bad({ k: 'label', txt: 'A' }, /needs x, y or gx, gy/);
  bad({ k: 'bars', x: 0.1, y: 0.1, w: 0.5, h: 0.3, vals: 'abc' }, /"vals" must be a list of numbers/);
  bad({ k: 'bars', x: 0.1, y: 0.1, w: 0.5, h: 0.3, vals: [1, 2, 3], labels: ['a'] }, /"labels" needs one entry per value/);
});

test('scenes: "at" is seconds or a word of that beat', () => {
  const t = at => ({ k: 'text', txt: 'A', x: 0.5, y: 0.5, s: 0.05, at });
  for (const at of [0, 2.5, 'word:drag', 'word:FALLING,', 'word:fall+0.3', 'word:it#1']) good(t(at));
  for (const at of [-1, 'word:speed', 'word:falling#2', 'drag', '1.5']) bad(t(at), /"at" must be seconds or "word:/); // "speed" is said in beat 2, not beat 1
  assert.deepEqual(validateScenes({ beats: [{ beat: 2, intent: 'process', items: [t('word:speed')] }] }, video()), []);
});

test('every video in videos/ and every golden scene passes', () => {
  const dirs = [path.join(ROOT, 'videos'), ...fs.readdirSync(path.join(ROOT, 'styles')).map(s => path.join(ROOT, 'styles', s))];
  const files = dirs.filter(d => fs.existsSync(d) && fs.statSync(d).isDirectory()).flatMap(d => fs.readdirSync(d).filter(f => f.endsWith('.json') && !f.endsWith('.scenes.json')).map(f => path.join(d, f)));
  assert.ok(files.length >= 5, 'found the golden scenes');
  for (const f of files) {
    const sf = f.replace(/\.json$/, '.scenes.json'), v = rd(f);
    assert.ok(fs.existsSync(sf), `${sf} is missing`);
    assert.deepEqual([...validateVideo(v), ...validateScenes(rd(sf), v)], [], path.relative(ROOT, f));
  }
});

// ---- shot spec and cast
const shot = (sh, v = video()) => validateScenes({ beats: [{ beat: 1, intent: 'object', shot: sh, items: [] }] }, v);
test('shot: a full shot block and a missing one are both fine', () => {
  assert.deepEqual(shot({ style: 'blueprint', subject: 'Hubble telescope', action: 'sinks along its orbit', camera: 'push-in', framing: 'wide', motion: 'draw-on', light: 'flat' }), []);
  assert.deepEqual(validateScenes({ beats: [{ beat: 1, intent: 'object', items: [] }] }, video()), []);
});
test('shot: closed vocabularies', () => {
  for (const [f, ok] of Object.entries(SHOT)) {
    for (const v of ok) assert.deepEqual(shot({ [f]: v }), [], `${f}: ${v}`);
    has(shot({ [f]: 'zoom' }), new RegExp(`shot\\.${f} must be one of`));
  }
  assert.deepEqual(SHOT.camera, ['static', 'pan-left', 'pan-right', 'pan-up', 'pan-down', 'push-in', 'pull-out', 'follow']);
  assert.deepEqual(SHOT.framing, ['wide', 'medium', 'close']);
  for (const s of STYLES) assert.deepEqual(shot({ style: s }, video({ style: { primary: s } })), []);
  has(shot({ style: 'oil-paint' }), /shot\.style must be one of/);
});
test('shot: wrong shapes are named', () => {
  has(shot('push-in'), /shot must be an object/);
  has(shot(null), /shot must be an object/);
  has(shot({ zoom: 2 }), /shot\.zoom is not a shot field/);
  has(shot({ subject: 5 }), /shot\.subject must be text/);
  has(shot({ action: '' }), /shot\.action must be text/);
  has(shot({ ai: 'a prompt' }), /shot\.ai is not a shot field/); // the outside-video-model prompt was removed
});
test('shot: a video has its primary style and at most one other', () => {
  const v = video({ style: { primary: 'whiteboard' } }), b = (beat, style) => ({ beat, intent: 'object', shot: { style }, items: [] });
  const v3 = { ...v, beats: [...v.beats.slice(0, 1), ...v.beats.slice(0, 1), ...v.beats] };
  assert.deepEqual(validateScenes({ beats: [b(1, 'whiteboard'), b(2, 'blueprint'), b(3, 'blueprint')] }, v3), []);
  has(validateScenes({ beats: [b(1, 'chalkboard'), b(2, 'blueprint')] }, v3), /at most one other/);
  has(validateScenes({ beats: [b(1, 'chalkboard')] }, { ...v3, style: { primary: 'whiteboard', accent: 'blueprint' } }), /at most one other/);
});
test('video: style must be a known kit, geo a known audience', () => {
  has(validateVideo(video({ style: { primary: 'oil-paint' } })), /style: "oil-paint" is not a kit/);
  for (const g of ['global', 'india', 'us']) assert.deepEqual(validateVideo(video({ geo: g })), []);
  has(validateVideo(video({ geo: 'uk' })), /^geo:/);
});
test('cast: a map of name to one description', () => {
  assert.deepEqual(validateVideo(video({ cast: { mascot: 'small hero, red cape, round head' } })), []);
  for (const c of [['mascot'], 'mascot', { mascot: 5 }, { mascot: '' }, null]) has(validateVideo(video({ cast: c })), /^cast:/);
});
test('build: page.json carries camera and framing only, never the words of the shot', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p2-')), v = video({ id: 't-shot', style: { primary: 'whiteboard' } });
  fs.writeFileSync(path.join(dir, 't-shot.json'), JSON.stringify(v));
  fs.writeFileSync(path.join(dir, 't-shot.scenes.json'), JSON.stringify({ beats: [{ beat: 1, intent: 'object', shot: { camera: 'push-in', subject: 'PROMPT-XYZ' }, items: [] }] }));
  execFileSync('node', [path.join(ROOT, 'build.mjs'), path.join(dir, 't-shot.json'), '--estimate', '--out', dir]);
  const raw = fs.readFileSync(path.join(dir, 'page.json'), 'utf8');
  assert.deepEqual(JSON.parse(raw).beats[0].shot, { camera: 'push-in' });
  assert.ok(!raw.includes('PROMPT-XYZ'));
  fs.rmSync(dir, { recursive: true });
});

test('photo item: a short name, never a URL, and not more than 60% of the box', () => {
  good({ k: 'photo', src: 'hubble-1', q: 'Hubble Space Telescope', x: 0.1, y: 0.25, w: 0.8, h: 0.38 });
  bad({ k: 'photo', src: 'https://x.org/a.jpg', x: 0.1, y: 0.25, w: 0.8, h: 0.38 }, /never a URL/);
  bad({ k: 'photo', src: 'hubble-1', x: 0, y: 0, w: 1, h: 0.8 }, /at most 60%/);
  bad({ k: 'photo', src: 'hubble-1', q: 5, x: 0.1, y: 0.25, w: 0.5, h: 0.3 }, /search words/);
  bad({ k: 'photo', x: 0.1, y: 0.25, w: 0.5, h: 0.3 }, /missing "src"/);
});
