// Reads and checks ../flow.json, the settings for How To Hero videos (numbers only; the steps are in SKILL.md and SCOUT.md).
// CLI: node flow.mjs check                     exit 1 with the reasons if flow.json is wrong
//      node flow.mjs resolve videos/<id>.json  pick the style once and write { style, flowSha } into the video json
//      node flow.mjs explain                   print the settings and each kit's share of new videos
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { pickStyle } from './pickstyle.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
export const FLOW = path.join(ROOT, '..', 'flow.json');
const rd = p => JSON.parse(fs.readFileSync(p, 'utf8'));
export const STATUSES = ['core', 'trial', 'accent-only', 'retired'];

export function loadFlow(file = FLOW) { return rd(file); }
// the registry holds what a kit is (fit, formats, colours); flow.json holds how often to use it (weight, status)
export function kits(flow = loadFlow()) {
  return rd(path.join(ROOT, 'styles', 'registry.json')).map(k => ({ ...k, ...(flow.style.kits[k.slug] || { weight: 0, status: 'retired' }) }));
}
export function flowSha(file = FLOW) { return crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 10); }
export function pickOpts(flow, intents = []) {
  const s = flow.style;
  return { trialShare: s.trialShare, floor: s.floor, seriesLock: s.seriesLock, intents };
}

export function flowErrors(flow) {
  const e = [], num = (v, at, lo = 0, hi = Infinity) => { if (typeof v !== 'number' || !(v >= lo && v <= hi)) e.push(`${at} must be a number from ${lo} to ${hi}`); };
  const obj = (v, at) => { if (!v || typeof v !== 'object' || Array.isArray(v)) { e.push(`${at} must be an object`); return false; } return true; };
  const known = (o, keys, at) => Object.keys(o).filter(k => !keys.includes(k)).forEach(k => e.push(`${at}.${k} is not a known setting (${keys.join(', ')})`));
  if (!obj(flow, 'flow.json')) return e;
  known(flow, ['_about', 'channel', 'scout', 'fix', 'build', 'style', 'voice', 'sound', 'photos'], 'flow');
  if (typeof flow.channel !== 'string' || !/^[a-z0-9-]+$/.test(flow.channel)) e.push('channel must be a short id like "how-to-hero"');
  if (obj(flow.scout, 'scout')) {
    for (const k of ['newsMin', 'newsMax', 'newsWindowHours', 'newsWindowWeekendHours', 'weekFallbackDays', 'maxPendingIdeas', 'maxIdeaBacklog', 'ideasWhenBacklogged', 'docsPerWeek', 'maxOpenDocs']) num(flow.scout[k], `scout.${k}`);
    if (flow.scout.newsWindowWeekendHours < flow.scout.newsWindowHours) e.push('scout.newsWindowWeekendHours is less than scout.newsWindowHours');
    if (flow.scout.weekFallbackDays * 24 <= flow.scout.newsWindowWeekendHours) e.push('scout.weekFallbackDays must be longer than the weekend news window');
    if (flow.scout.newsMin > flow.scout.newsMax) e.push('scout.newsMin is more than scout.newsMax');
    if (obj(flow.scout.mix, 'scout.mix')) for (const [k, v] of Object.entries(flow.scout.mix)) num(v, `scout.mix.${k}`);
  }
  if (flow.fix !== undefined && obj(flow.fix, 'fix')) { known(flow.fix, ['maxFixes', 'maxPerRun'], 'fix'); num(flow.fix.maxFixes, 'fix.maxFixes', 0, 10); num(flow.fix.maxPerRun, 'fix.maxPerRun', 0, 20); }
  if (obj(flow.build, 'build')) {
    known(flow.build, ['maxPerRun', 'claimTtlMinutes', 'maxVersionsPerRun', 'paused', 'budgetMinutes'], 'build');
    num(flow.build.maxPerRun, 'build.maxPerRun', 0, 50); num(flow.build.claimTtlMinutes, 'build.claimTtlMinutes', 10);
    num(flow.build.maxVersionsPerRun, 'build.maxVersionsPerRun', 0, 50); num(flow.build.budgetMinutes, 'build.budgetMinutes', 10, 600);
    if (typeof flow.build.paused !== 'boolean') e.push('build.paused must be true or false');
  }
  if (obj(flow.style, 'style')) {
    const s = flow.style;
    known(s, ['trialShare', 'floor', 'seriesLock', 'kits'], 'style');
    num(s.trialShare, 'style.trialShare', 0, 1); num(s.floor, 'style.floor', 0, 1);
    const slugs = rd(path.join(ROOT, 'styles', 'registry.json')).map(k => k.slug);
    if (obj(s.kits, 'style.kits')) {
      for (const [slug, k] of Object.entries(s.kits)) {
        if (!slugs.includes(slug)) e.push(`style.kits.${slug}: no such kit in styles/registry.json (${slugs.join(', ')})`);
        if (!obj(k, `style.kits.${slug}`)) continue;
        num(k.weight, `style.kits.${slug}.weight`, 0, 10);
        if (!STATUSES.includes(k.status)) e.push(`style.kits.${slug}.status must be one of ${STATUSES.join(', ')}`);
      }
      for (const slug of slugs) if (!s.kits[slug]) e.push(`style.kits has no entry for the kit "${slug}"`);
      if (!Object.values(s.kits).some(k => k && k.status === 'core')) e.push('style.kits needs at least one "core" kit');
    }
    if (obj(s.seriesLock, 'style.seriesLock')) for (const [ser, slug] of Object.entries(s.seriesLock)) if (!slugs.includes(slug)) e.push(`style.seriesLock.${ser}: unknown kit "${slug}"`);
  }
  if (obj(flow.voice, 'voice')) {
    const v = flow.voice;
    known(v, ['default', 'byGeo', 'fallback', 'voices'], 'voice');
    if (obj(v.voices, 'voice.voices')) {
      const names = Object.keys(v.voices);
      for (const [n, x] of Object.entries(v.voices)) {
        if (!obj(x, `voice.voices.${n}`)) continue;
        if (!['kokoro', 'edge'].includes(x.engine)) e.push(`voice.voices.${n}.engine must be kokoro or edge`);
        if (typeof x.voice !== 'string' || !x.voice) e.push(`voice.voices.${n}.voice must name the voice`);
        if (x.speed !== undefined) num(x.speed, `voice.voices.${n}.speed`, 0.5, 2);
      }
      for (const k of ['default', 'fallback']) if (!names.includes(v[k])) e.push(`voice.${k} must be one of voice.voices (${names.join(', ')})`);
      if (v.voices[v.fallback] && v.voices[v.fallback].engine !== 'kokoro') e.push('voice.fallback must be a kokoro voice (it runs on the machine, so it cannot fail for network reasons)');
      if (obj(v.byGeo, 'voice.byGeo')) for (const [g, n] of Object.entries(v.byGeo)) if (!names.includes(n)) e.push(`voice.byGeo.${g}: unknown voice "${n}"`);
    }
  }
  if (flow.sound !== undefined && obj(flow.sound, 'sound')) { // the sound pass (sfx.py): earshot requests in words, volumes 0-1
    const s = flow.sound;
    known(s, ['enabled', 'cut', 'hit', 'end', 'bed', 'bedByKeyword', 'volume'], 'sound');
    if (typeof s.enabled !== 'boolean') e.push('sound.enabled must be true or false');
    for (const k of ['cut', 'hit', 'end', 'bed']) if (typeof s[k] !== 'string' || !s[k]) e.push(`sound.${k} must be a sound request in words`);
    if (s.bedByKeyword !== undefined && obj(s.bedByKeyword, 'sound.bedByKeyword')) for (const [w, ks] of Object.entries(s.bedByKeyword)) if (!Array.isArray(ks) || !ks.length) e.push(`sound.bedByKeyword.${w} must list topic words`);
    if (obj(s.volume, 'sound.volume')) for (const k of ['cut', 'hit', 'end', 'bed']) num(s.volume[k], `sound.volume.${k}`, 0, 1);
  }
  if (flow.photos !== undefined && obj(flow.photos, 'photos')) { // photos.py: Openverse cc0/pdm photos for news Shorts
    const s = flow.photos;
    known(s, ['enabled', 'newsOnly', 'maxPerVideo', 'minLongSide', 'minShortSide', 'trustedSources'], 'photos');
    for (const k of ['enabled', 'newsOnly']) if (typeof s[k] !== 'boolean') e.push(`photos.${k} must be true or false`);
    num(s.maxPerVideo, 'photos.maxPerVideo', 0, 4); num(s.minLongSide, "photos.minLongSide", 800, 8000); num(s.minShortSide, "photos.minShortSide", 400, 8000);
    if (!Array.isArray(s.trustedSources) || s.trustedSources.some(x => typeof x !== 'string')) e.push('photos.trustedSources must be a list of source names');
  }
  return e;
}
// the voice for a video: its own "voice", else the one for its geo, else the default
export function voiceFor(v, flow = loadFlow()) { return v.voice || (flow.voice.byGeo || {})[v.geo] || flow.voice.default; }

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, arg] = process.argv.slice(2), flow = loadFlow(), errs = flowErrors(flow);
  if (errs.length) { console.error('flow.json is not valid:\n' + errs.map(x => '  ' + x).join('\n')); process.exit(1); }
  if (cmd === 'check') console.log('flow.json is valid (' + flowSha() + ')');
  else if (cmd === 'resolve') {
    const v = rd(arg), sf = arg.replace(/\.json$/, '.scenes.json');
    if (!v.style) v.style = pickStyle(v, kits(flow), pickOpts(flow, fs.existsSync(sf) ? rd(sf).beats.map(b => b.intent) : []));
    v.flowSha = flowSha();
    fs.writeFileSync(arg, JSON.stringify(v, null, 2) + '\n');
    console.log(JSON.stringify({ style: v.style, flowSha: v.flowSha }));
  } else if (cmd === 'explain') {
    const n = 2000, count = {};
    for (let i = 0; i < n; i++) { const s = pickStyle({ id: 'sample-' + i }, kits(flow), pickOpts(flow)).primary; count[s] = (count[s] || 0) + 1; }
    console.log(`flow.json ${flowSha()}: up to ${flow.build.maxPerRun} videos a run, ${flow.build.budgetMinutes} min budget, ${flow.build.paused ? 'PAUSED' : 'running'}`);
    for (const k of kits(flow)) console.log(`  ${k.slug.padEnd(16)} ${k.status.padEnd(8)} weight ${k.weight}  ~${Math.round(100 * (count[k.slug] || 0) / n)}% of cards with no topic`);
  } else { console.error('usage: node flow.mjs check | resolve videos/<id>.json | explain'); process.exit(2); }
}
