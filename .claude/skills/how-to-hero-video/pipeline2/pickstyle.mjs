// Picks the style for a video. Same item id -> same answer, every time.
//   1. the card says so (card.data.style, a slug or { primary, accent }; an unknown slug is an error)   2. the series is locked to a style
//   3. a weighted pick among "core" kits that fit the kind/topic (about 1 in 5 picks goes to a "trial" kit); no weight counts as less than opts.floor
// Kits come from flow.mjs kits(): registry facts plus weight and status from flow.json.
// The accent kit is only offered when a beat is a chart, map or timeline and the primary kit lists a partner in pairsWith.
// To pick from the command line use: node flow.mjs resolve videos/<id>.json

const ACCENT_INTENTS = ['chart', 'map', 'timeline'];
function rng(str) { // small seeded generator (FNV-1a hash -> mulberry32)
  let h = 2166136261; for (const c of String(str)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h = (h + 0x6D2B79F5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// card: { id, series?, kind?, topics?, format?, data?: { style?, kind?, topics? } }
// opts: { seriesLock?: { SERIES: slug }, trialShare?: 0.2, floor?: 0.1, intents?: [beat intents] }
export function pickStyle(card, registry, opts = {}) {
  const d = card.data || {}, by = Object.fromEntries(registry.map(k => [k.slug, k])), usable = s => by[s] && by[s].status !== 'retired';
  const withAccent = primary => {
    const a = (opts.intents || []).some(i => ACCENT_INTENTS.includes(i)) && (by[primary].pairsWith || []).find(usable);
    return a ? { primary, accent: a } : { primary };
  };
  const asked = typeof d.style === 'string' ? { primary: d.style } : d.style;
  // a slug nobody knows is a typo, not a wish for a random style ("classic" is the old pipeline's look: it falls through)
  for (const s of asked ? [asked.primary, asked.accent] : []) if (s && s !== 'classic' && !by[s]) throw new Error(`pickStyle: ${card.id} asks for style "${s}", which is not in the registry (${registry.map(k => k.slug).join(', ')})`);
  if (asked && usable(asked.primary)) return asked.accent && usable(asked.accent) ? asked : withAccent(asked.primary);
  const lock = (opts.seriesLock || {})[card.series];
  if (lock && usable(lock)) return withAccent(lock);

  const kind = card.kind || d.kind, topics = card.topics || d.topics || [], format = card.format || 'short';
  let fits = registry.filter(k => k.formats.includes(format) && (!kind || !k.fit.kinds.length || k.fit.kinds.includes(kind)));
  const onTopic = fits.filter(k => k.fit.topics.some(t => topics.includes(t)));
  if (onTopic.length) fits = onTopic;
  const rand = rng(card.id), active = fits.filter(k => k.status === 'core'), trial = fits.filter(k => k.status === 'trial');
  const first = rand() < (opts.trialShare ?? 0.2) ? trial : active, pool = first.length ? first : active.length ? active : trial;
  if (!pool.length) throw new Error(`pickStyle: no core or trial kit fits ${card.id} (kind ${kind}, format ${format})`);
  const w = k => Math.max(opts.floor ?? 0, k.weight);
  let r = rand() * pool.reduce((a, k) => a + w(k), 0);
  return withAccent((pool.find(k => (r -= w(k)) < 0) || pool[pool.length - 1]).slug);
}

