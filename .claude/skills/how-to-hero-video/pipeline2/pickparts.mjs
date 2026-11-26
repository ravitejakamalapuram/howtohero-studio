// Picks the three opening and ending parts of a video: the hook's shape, the opening picture and the end card
// (what each one is: ../HOOKS.md). Same item id -> same answer, every time.
// About `trialShare` of the videos get a trial value for ONE part (the hook twice as often as the opening or the
// end card, because it has the most shapes to compare); every other part is its default. One trial part a video
// keeps the comparison clean: a video's result is never the mix of two experiments.
// A value the card already names (data.hookPattern, data.opening, data.endCard) wins.
// CLI: node pickparts.mjs <item id> ['<card data as JSON>']   prints {"hookPattern","opening","endCard"}
import { pathToFileURL } from 'node:url';
import { loadFlow } from './flow.mjs';

export const PARTS = { hook: 'hookPattern', opening: 'opening', endCard: 'endCard' }; // flow.json name -> card data field

function rng(str) { // small seeded generator (FNV-1a hash -> mulberry32), as in pickstyle.mjs
  let h = 2166136261; for (const c of String(str)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h = (h + 0x6D2B79F5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// parts: flow.json "parts" ({ trialShare, hook: { default, trial: [] }, opening: {...}, endCard: {...} })
const WEIGHT = { hook: 2, opening: 1, endCard: 1 };
export function pickParts(id, parts, data = {}) {
  const names = Object.keys(PARTS), asked = n => [parts[n].default, ...parts[n].trial].includes(data[PARTS[n]]);
  const out = Object.fromEntries(names.map(n => [PARTS[n], asked(n) ? data[PARTS[n]] : parts[n].default]));
  const rand = rng(id), open = names.filter(n => !asked(n) && parts[n].trial.length);
  if (!open.length || rand() >= parts.trialShare) return out;
  let r = rand() * open.reduce((a, n) => a + WEIGHT[n], 0);
  const n = open.find(k => (r -= WEIGHT[k]) < 0) || open[open.length - 1];
  out[PARTS[n]] = parts[n].trial[Math.floor(rand() * parts[n].trial.length)];
  return out;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const [id, data] = process.argv.slice(2);
  if (!id) { console.error("usage: node pickparts.mjs <item id> ['<card data as JSON>']"); process.exit(2); }
  console.log(JSON.stringify(pickParts(id, loadFlow().parts, data ? JSON.parse(data) : {})));
}
