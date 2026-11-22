// Checks videos/<id>.json and videos/<id>.scenes.json. Each validator returns a list of error strings (empty = fine).
// CLI: node schema.mjs videos/<id>.json
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ICON } from './engine/icons.js';
import { CUSTOM } from './engine/custom.js';

export const ROLES = ['ink', 'accent', 'warn', 'good', 'muted', 'paper'];
export const INTENTS = ['title', 'object', 'process', 'compare', 'count', 'chart', 'map', 'timeline', 'cutaway', 'quote', 'payoff', 'endcard'];
export const ACCENT_INTENTS = ['chart', 'map', 'timeline']; // beats that may use the accent kit
export const ICONS = Object.keys(ICON);
// item kind -> required fields
export const KINDS = {
  text: ['txt', 'x', 'y', 's'], num: ['to', 'x', 'y', 's'], hl: ['x', 'y', 'w', 'h'], line: ['pts'], arrow: ['pts'], circle: ['x', 'y', 'r'], ell: ['x', 'y', 'rx', 'ry'],
  rect: ['x', 'y', 'w', 'h'], photo: ['src', 'x', 'y', 'w', 'h'], icon: ['name'], move: ['icon', 'path', 's'], dim: ['x1', 'y1', 'x2', 'y2', 'label'], mk: ['x', 'y'], banner: ['x', 'y', 'w', 'txt'], label: ['txt'],
  bars: ['x', 'y', 'w', 'h', 'vals'], box: ['gx', 'gy', 'w', 'dp', 'h'], tower: ['gx', 'gy', 'h'], slab: ['gx', 'gy', 'w', 'dp'], dishsite: ['gx', 'gy'], link: ['a', 'b'], iplane: ['a', 's'], custom: ['fn'],
};
const NUMS = ['x', 'y', 's', 'r', 'r1', 'rx', 'ry', 'w', 'h', 'lw', 'x1', 'y1', 'x2', 'y2', 'gx', 'gy', 'gz', 'dp', 'd', 'to', 'from', 'fly', 'max', 'fit', 'rot', 'a0', 'a1', 'zoom'];
const norm = w => w.toLowerCase().replace(/[^a-z0-9]/g, '');
const isStr = v => typeof v === 'string' && v.length > 0, isNum = v => typeof v === 'number' && Number.isFinite(v);
const isPts = v => Array.isArray(v) && v.length >= 2 && v.every(p => Array.isArray(p) && p.length === 2 && p.every(isNum));

// "word:drag", "word:drag#2" (second time it is said), "word:drag+0.3" (seconds after) -> { i: word index, off } or null
export function findWord(say, at) {
  const m = /^word:([^#+\s]+?)(?:#(\d+))?([+-]\d*\.?\d+)?$/.exec(at); if (!m) return null;
  const find = (w, n) => say.split(/\s+/).findIndex(x => norm(x) === norm(w) && --n === 0);
  const whole = m[2] ? -1 : find(m[1] + (m[3] || ''), 1); // "word:covid-19" is the word covid-19, not covid minus 19 seconds
  if (whole >= 0) return { i: whole, off: 0 };
  const i = find(m[1], +(m[2] || 1));
  return i < 0 ? null : { i, off: +(m[3] || 0) };
}

// optional "shot" on a scene beat: one line of a shot list. camera and framing move the picture and style names the kit;
// subject, action, motion and light are the plan in words.
export const SHOT = { camera: ['static', 'pan-left', 'pan-right', 'pan-up', 'pan-down', 'push-in', 'pull-out', 'follow'], framing: ['wide', 'medium', 'close'], motion: ['draw-on', 'slide', 'pop', 'morph'], light: ['flat', 'spot', 'vignette'] };
export const SHOT_KEYS = ['style', 'subject', 'action', ...Object.keys(SHOT)];
export const GEOS = ['global', 'india', 'us'];
export const STYLES = JSON.parse(fs.readFileSync(new URL('./styles/registry.json', import.meta.url), 'utf8')).map(k => k.slug);
function shotErrors(sh, at) {
  if (!sh || typeof sh !== 'object' || Array.isArray(sh)) return [`${at}: shot must be an object like { "camera": "push-in", "framing": "wide" }`];
  const e = [];
  for (const k of Object.keys(sh)) if (!SHOT_KEYS.includes(k)) e.push(`${at}: shot.${k} is not a shot field; use ${SHOT_KEYS.join(', ')}`);
  for (const [f, ok] of Object.entries(SHOT)) if (sh[f] !== undefined && !ok.includes(sh[f])) e.push(`${at}: shot.${f} must be one of ${ok.join(', ')}`);
  if (sh.style !== undefined && !STYLES.includes(sh.style)) e.push(`${at}: shot.style must be one of ${STYLES.join(', ')}`);
  for (const f of ['subject', 'action']) if (sh[f] !== undefined && !isStr(sh[f])) e.push(`${at}: shot.${f} must be text in quotes`);
  return e;
}
export function validateVideo(v) {
  const e = [], B = v.beats;
  if (!isStr(v.id)) e.push('id: missing');
  if (!isStr(v.file) || !v.file.endsWith('.mp4')) e.push('file: must be a name ending in .mp4');
  if (v.format && !['short', 'doc'].includes(v.format)) e.push('format: must be "short" or "doc"');
  if (v.style && !isStr(v.style.primary)) e.push('style: needs "primary" (a kit slug)');
  for (const k of v.style ? [v.style.primary, v.style.accent] : []) if (isStr(k) && !STYLES.includes(k)) e.push(`style: "${k}" is not a kit in styles/registry.json (${STYLES.join(', ')})`);
  if (v.geo !== undefined && !GEOS.includes(v.geo)) e.push(`geo: must be one of ${GEOS.join(', ')} (who the video is for)`);
  if (v.hook && !(Array.isArray(v.hook.lines) && v.hook.lines.length >= 1 && v.hook.lines.length <= 2 && v.hook.lines.every(isStr))) e.push('hook.lines: 1 or 2 lines of text');
  if (!v.card || !Array.isArray(v.card.lines) || !v.card.lines.length || v.card.lines.length > 3 || !v.card.lines.every(isStr)) e.push('card.lines: 1 to 3 lines of end card text');
  if (v.cast !== undefined && !(v.cast && typeof v.cast === 'object' && !Array.isArray(v.cast) && Object.values(v.cast).every(isStr))) e.push('cast: a map of character name to one fixed description');
  if (!Array.isArray(B) || B.length < 2) return [...e, 'beats: need at least one spoken beat plus the end card beat'];
  B.forEach((b, i) => {
    if (i < B.length - 1 && !isStr(b.say)) e.push(`beats[${i + 1}]: needs "say" (only the last beat, the end card, may be silent)`);
    if (b.words && (!isStr(b.say) || b.words.length !== b.say.split(/\s+/).length || !b.words.every(w => isNum(w[1])))) e.push(`beats[${i + 1}].words: one [word, seconds] pair per word of "say"`);
  });
  if (v.audio) {
    const s = v.audio.starts;
    if (!isStr(v.audio.file)) e.push('audio.file: missing');
    if (!Array.isArray(s) || s.length !== B.length || !s.every(isNum) || s.some((t, i) => i && t <= s[i - 1])) e.push(`audio.starts: ${B.length} rising start times in seconds, one per beat (the last is where the end card starts)`);
  }
  return e;
}

// Richness gate: a beat of only words and a few boxes is the "plain video" the user keeps rejecting.
// A beat needs a real picture (icon, custom drawing, photo, bars, a moving icon, a 3D piece) or at least 3 drawn shapes besides its words;
// and the video as a whole needs at least 4 different pictures, so it is not the same icon over and over.
const WORDS = new Set(['text', 'num', 'label', 'banner', 'hl']), SHAPES = new Set(['line', 'arrow', 'circle', 'ell', 'rect', 'dim', 'mk', 'link']);
export function richnessErrors(s) {
  const e = [], pics = new Set();
  for (const b of s.beats || []) {
    const items = Array.isArray(b.items) ? b.items : [], drawing = i => i && (i.k === 'line' || i.k === 'arrow') && Array.isArray(i.pts) && i.pts.length >= 8, // a long outline is a drawing, not a rule
      hero = items.filter(i => i && ((!WORDS.has(i.k) && !SHAPES.has(i.k)) || drawing(i))), shapes = items.filter(i => i && SHAPES.has(i.k) && !drawing(i));
    for (const i of hero) pics.add(`${i.k}:${i.name || i.icon || i.fn || i.src || (i.pts ? b.beat : '')}`);
    if (!hero.length && shapes.length < 3) e.push(`scenes beat ${b.beat}: only words${shapes.length ? ' and ' + shapes.length + ' shape(s)' : ''}; add a picture (an icon, a custom drawing, bars or a photo) or draw it with at least 3 shapes`);
  }
  if (s.beats && s.beats.length >= 4 && pics.size < 4) e.push(`scenes: only ${pics.size} different picture(s) in the whole video; use at least 4 (different icons or drawings)`);
  return e;
}
export function validateScenes(s, v) {
  const e = [], n = v.beats.length - 1, seen = new Set();
  if (!s || !Array.isArray(s.beats)) return ['scenes: needs "beats": [...]'];
  for (const b of s.beats) {
    const at = `scenes beat ${b.beat}`;
    if (!Number.isInteger(b.beat) || b.beat < 1 || b.beat > n) { e.push(`${at}: "beat" must be 1..${n} (the end card is drawn by the brand layer)`); continue; }
    if (seen.has(b.beat)) e.push(`${at}: listed twice`); seen.add(b.beat);
    if (!INTENTS.includes(b.intent)) e.push(`${at}: intent must be one of ${INTENTS.join(', ')}`);
    if (b.shot !== undefined) e.push(...shotErrors(b.shot, at));
    if (!Array.isArray(b.items)) { e.push(`${at}: needs "items": [...]`); continue; }
    b.items.forEach((it, j) => {
      if (!it || typeof it !== 'object') return e.push(`${at} item ${j + 1}: must be an object like { "k": "text", ... }`);
      const w = `${at} item ${j + 1} (${it.k})`, need = KINDS[it.k];
      if (!need) return e.push(`${w}: unknown kind; use one of ${Object.keys(KINDS).join(', ')}`);
      for (const f of need) if (it[f] === undefined) e.push(`${w}: missing "${f}"`);
      for (const f of NUMS) if (it[f] !== undefined && !isNum(it[f])) e.push(`${w}: "${f}" must be a number`);
      if (it.role !== undefined && !ROLES.includes(it.role)) e.push(`${w}: role must be one of ${ROLES.join(', ')}`);
      if (it.c !== undefined) e.push(`${w}: "c" is not used; give a semantic "role"`);
      if (it.at !== undefined && !(isNum(it.at) && it.at >= 0) && !(typeof it.at === 'string' && findWord(v.beats[b.beat - 1].say || '', it.at))) e.push(`${w}: "at" must be seconds or "word:<a word in this beat's say>" (got ${JSON.stringify(it.at)})`);
      for (const f of ['pts', 'path']) if (it[f] !== undefined && !isPts(it[f])) e.push(`${w}: "${f}" must be a list of [x, y] points`);
      for (const f of ['a', 'b']) if (it[f] !== undefined && !(Array.isArray(it[f]) && it[f].length === 3 && it[f].every(isNum))) e.push(`${w}: "${f}" must be [gx, gy, gz]`);
      if (it.k === 'icon' && !(Array.isArray(it.box) && it.box.length === 3 && it.box.every(isNum)) && !['x', 'y', 's'].every(f => isNum(it[f]))) e.push(`${w}: needs "box": [x, y, size] or x, y, s`);
      for (const f of ['name', 'icon']) if (it[f] !== undefined && !ICONS.includes(it[f]) && need.includes(f)) e.push(`${w}: unknown icon "${it[f]}"; have ${ICONS.join(', ')}`);
      if (it.k === 'photo' && !/^[a-z0-9-]+$/.test(it.src || '')) e.push(`${w}: "src" must be a short name like "hubble-1" (a-z, 0-9, -), never a URL`);
      if (it.k === 'photo' && isNum(it.x) && isNum(it.y) && isNum(it.w) && isNum(it.h) && (it.x < 0 || it.y < 0 || it.w <= 0 || it.h <= 0 || it.x + it.w > 1 || it.y + it.h > 1)) e.push(`${w}: a photo box must stay inside the drawing box (x, y >= 0, x+w <= 1, y+h <= 1)`);
      if (it.k === 'photo' && isNum(it.w) && isNum(it.h) && it.w * it.h > 0.6) e.push(`${w}: a photo may cover at most 60% of the drawing box (w x h <= 0.6), so the captions stay readable`);
      if (it.q !== undefined && !isStr(it.q)) e.push(`${w}: "q" must be search words in quotes`);
      for (const f of ['txt', 'label']) if (it[f] !== undefined && !isStr(it[f])) e.push(`${w}: "${f}" must be text in quotes`);
      if (it.k === 'label' && !(isNum(it.x) && isNum(it.y)) && !(isNum(it.gx) && isNum(it.gy))) e.push(`${w}: needs x, y or gx, gy`);
      if (it.k === 'bars' && it.vals !== undefined && !(Array.isArray(it.vals) && it.vals.length && it.vals.every(isNum))) e.push(`${w}: "vals" must be a list of numbers`);
      else if (it.labels !== undefined && !(Array.isArray(it.labels) && it.labels.length === (it.vals || []).length)) e.push(`${w}: "labels" needs one entry per value`);
      if (it.k === 'custom' && !CUSTOM[it.fn]) e.push(`${w}: unknown fn "${it.fn}"; have ${Object.keys(CUSTOM).join(', ')}`);
      if (it.k === 'mk' && !(isNum(it.rx) && isNum(it.ry)) && !(isNum(it.w) && isNum(it.h))) e.push(`${w}: needs rx, ry (ellipse) or w, h (rect)`);
    });
  }
  e.push(...richnessErrors(s));
  // one primary style per video and at most one other
  const prim = v.style && v.style.primary, other = new Set(s.beats.map(b => b.shot && b.shot.style).filter(x => isStr(x) && x !== prim));
  if (v.style && v.style.accent) other.add(v.style.accent);
  if (prim && other.size > 1) e.push(`scenes: shot.style names ${[...other].join(' and ')}; a video has its primary style and at most one other`);
  return e;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const f = process.argv[2], rd = p => JSON.parse(fs.readFileSync(p, 'utf8')), v = rd(f), sf = f.replace(/\.json$/, '.scenes.json');
  const errs = [...validateVideo(v), ...(fs.existsSync(sf) ? validateScenes(rd(sf), v) : [`${sf}: not found`])];
  console.log(errs.length ? errs.join('\n') : 'ok'); process.exit(errs.length ? 1 : 0);
}
