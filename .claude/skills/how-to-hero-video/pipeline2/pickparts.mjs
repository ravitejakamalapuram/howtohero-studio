// Picks the three opening and ending parts of a video: the hook's shape, the opening picture and the end card
// (what each one is: ../HOOKS.md). Same item id -> same answer, every time.
// Most videos get each part's "default" (what works today). About `trialShare` of them get one of the other
// values instead, so the weekly report (publisher/learn.py) has something to compare. Each part is drawn
// separately, so two trial parts rarely land on the same video.
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
export function pickParts(id, parts, data = {}) {
  const out = {};
  for (const [name, field] of Object.entries(PARTS)) {
    const p = parts[name], all = [p.default, ...p.trial];
    if (all.includes(data[field])) { out[field] = data[field]; continue; }
    const rand = rng(`${id}:${name}`);
    out[field] = p.trial.length && rand() < parts.trialShare ? p.trial[Math.floor(rand() * p.trial.length)] : p.default;
  }
  return out;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const [id, data] = process.argv.slice(2);
  if (!id) { console.error("usage: node pickparts.mjs <item id> ['<card data as JSON>']"); process.exit(2); }
  console.log(JSON.stringify(pickParts(id, loadFlow().parts, data ? JSON.parse(data) : {})));
}
