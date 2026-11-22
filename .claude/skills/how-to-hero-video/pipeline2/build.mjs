// node build.mjs <id | path/to/<id>.json> [--style slug] [--accent slug|none] [--estimate] [--audio file] [--voice name] [--out dir]
// Reads videos/<id>.json + videos/<id>.scenes.json, checks them, picks the style if the video has none (and saves the pick),
// works out when every beat starts, turns "word:" anchors into seconds and writes <out>/page.json for render.cjs.
// Timing comes from one of:
//   - "audio": { "file", "starts": [...] }  a finished voice track and the second each beat starts at
//   - --estimate, or "dur" on every beat     no audio; 2.6 words a second (for tests and golden scenes)
//   - otherwise the voice is made from flow.json's voice settings: Kokoro (npx hyperframes tts) or Edge (tts_edge.py);
//     an Edge voice that fails falls back to the Kokoro fallback voice for the whole video, and voiceUsed records which one spoke
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateVideo, validateScenes, richnessErrors, findWord, ACCENT_INTENTS } from './schema.mjs';
import { pickStyle } from './pickstyle.mjs';
import { loadFlow, kits, pickOpts, flowSha, voiceFor } from './flow.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url)), args = process.argv.slice(2);
const opt = n => { const i = args.indexOf('--' + n); return i < 0 ? null : args[i + 1]; };
const rd = p => JSON.parse(fs.readFileSync(p, 'utf8')), r3 = n => +n.toFixed(3);
if (!args[0] || args[0].startsWith('--')) { console.error('usage: node build.mjs <id | path/to/<id>.json> [--style slug] [--accent slug|none] [--estimate] [--audio file] [--voice name] [--out dir]'); process.exit(1); }
const src = args[0].endsWith('.json') ? path.resolve(args[0]) : path.join(ROOT, 'videos', args[0] + '.json');
const sf = src.replace(/\.json$/, '.scenes.json');
for (const f of [src, sf]) if (!fs.existsSync(f)) { console.error('not found: ' + f); process.exit(1); }
const V = rd(src), S = rd(sf);
const errs = [...validateVideo(V), ...validateScenes(S, V), ...richnessErrors(S)];
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
const out = path.resolve(opt('out') || path.join(ROOT, 'work', V.id)); fs.mkdirSync(out, { recursive: true });

// style: kept if the video has one, otherwise picked once and written back
if (!V.style) {
  const flow = loadFlow();
  V.style = pickStyle(V, kits(flow), pickOpts(flow, S.beats.map(b => b.intent))); V.flowSha = flowSha();
  fs.writeFileSync(src, JSON.stringify(V, null, 2) + '\n');
}
const style = { ...V.style };
// a beat whose shot names another kit than the primary is drawn with the accent kit (schema allows one such kit)
const other = b => b.shot && b.shot.style && b.shot.style !== V.style.primary ? b.shot.style : null;
style.accent = S.beats.map(other).find(Boolean) || style.accent;
if (opt('style')) style.primary = opt('style');
if (opt('accent')) style.accent = opt('accent');
if (style.accent === 'none') delete style.accent;
for (const s of [style.primary, style.accent]) if (s && !fs.existsSync(path.join(ROOT, 'styles', s, 'kit.js'))) { console.error(`unknown style "${s}": there is no styles/${s}/kit.js`); process.exit(1); }

// timing: starts[i] / ends[i] = when beat i is spoken; the last beat is the end card
const N = V.beats.length, GAP = 0.26, LEAD = 0.35, TAIL = 1.0, READ = ['text', 'label', 'banner', 'num'];
const probe = f => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim();
let starts, ends, dur, audio = null;
if (V.audio) {
  audio = opt('audio') ? path.resolve(opt('audio')) : path.resolve(path.dirname(src), V.audio.file); starts = V.audio.starts;
  if (!fs.existsSync(audio)) { console.error('voice track not found: ' + audio + ' (pass --audio <file>)'); process.exit(1); }
  dur = V.audio.dur || probe(audio);
  ends = starts.map((s, i) => (V.audio.ends || [])[i] ?? (i < N - 1 ? starts[i + 1] - GAP : dur));
} else {
  const tts = !(args.includes('--estimate') || V.beats.every(b => b.dur || b.hold));
  let ds;
  if (!tts) ds = V.beats.map(b => b.dur || b.hold || (b.say ? b.say.split(/\s+/).length / 2.6 : 1.6));
  else {
    const flow = loadFlow(), voices = flow.voice.voices;
    const speak = name => V.beats.map((b, i) => { // one clip per beat
      if (!b.say) return b.hold || 1.6;
      const f = path.join(out, `v${i + 1}.wav`), x = voices[name], key = f.replace(/\.wav$/, '.key'), k = [b.say, name, x.voice, x.speed || 1].join('|');
      if (fs.existsSync(f) && fs.existsSync(key) && fs.readFileSync(key, 'utf8') === k) return probe(f); // same words, same voice: reuse the clip
      if (x.engine === 'edge') execFileSync('python3', [path.join(ROOT, 'tts_edge.py'), b.say, x.voice, f], { stdio: 'pipe', timeout: 60000 });
      else execFileSync('npx', ['--yes', 'hyperframes@0.9.33', 'tts', b.say, '-v', x.voice, '-s', (x.speed || 1).toFixed(3), '-o', f], { stdio: 'pipe' });
      fs.writeFileSync(key, k);
      return probe(f);
    });
    let name = opt('voice') || voiceFor(V, flow);
    if (!voices[name]) { console.error(`unknown voice "${name}" (flow.json voice.voices: ${Object.keys(voices).join(', ')})`); process.exit(1); }
    try { ds = speak(name); } catch (err) {
      if (name === flow.voice.fallback) throw err;
      console.error(`voice ${name} failed (${String(err.message).split('\n')[0]}); using ${flow.voice.fallback}`);
      name = flow.voice.fallback; ds = speak(name);
    }
    V.voiceUsed = name; fs.writeFileSync(src, JSON.stringify(V, null, 2) + '\n');
  }
  let t = LEAD; starts = []; ends = [];
  for (const d of ds) { starts.push(r3(t)); ends.push(r3(t + d)); t += d + GAP; }
  dur = +(ends[N - 1] + TAIL).toFixed(2);
  if (tts) { // lay the clips on one track
    const clips = V.beats.map((b, i) => [path.join(out, `v${i + 1}.wav`), starts[i]]).filter((c, i) => V.beats[i].say);
    audio = path.join(out, 'voice.wav');
    const fc = clips.map(([, s], i) => `[${i}]adelay=${Math.round(s * 1000)}:all=1[a${i}]`).join(';') + ';' + clips.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${clips.length}:normalize=0`;
    execFileSync('ffmpeg', ['-v', 'error', '-y', ...clips.flatMap(([f]) => ['-i', f]), '-filter_complex', fc, audio]);
  }
}

const scene = Object.fromEntries(S.beats.map(b => [b.beat, b]));
const beats = V.beats.slice(0, -1).map((b, i) => {
  const a = i ? starts[i] : 0, sc = scene[i + 1] || { items: [] }; let pos = 0;
  // when each word is spoken: given in "words", or spread across the beat by character position
  const wt = b.say.split(/\s+/).map((w, j) => { const t = b.words ? b.words[j][1] : starts[i] + (ends[i] - starts[i]) * pos / b.say.length; pos += w.length + 1; return r3(t); });
  // a label must be finished 1.3 s before its beat ends, so it can be read before the transition takes it away
  const late = it => READ.includes(it.k) && (it.at || 0) > 0 ? { ...it, at: r3(Math.max(0, Math.min(it.at, starts[i + 1] - a - (it.d || 0.8) - 1.3))) } : it;
  const items = sc.items.map(it => { if (typeof it.at !== 'string') return late(it); const f = findWord(b.say, it.at); return late({ ...it, at: r3(Math.max(0, wt[f.i] + f.off - a)) }); });
  return { say: b.say, start: starts[i], end: r3(ends[i]), a, b: starts[i + 1], intent: sc.intent, shot: sc.shot && { camera: sc.shot.camera, framing: sc.shot.framing }, // the only shot fields the page uses; ai never leaves the scene file
    accent: !!style.accent && (sc.shot && sc.shot.style ? sc.shot.style === style.accent : ACCENT_INTENTS.includes(sc.intent)), wt, items };
});
const page = { id: V.id, file: V.file, topic: V.topic, format: V.format || 'short', style, hook: V.hook, card: V.card, dur, endAt: starts[N - 1], audio, beats };
const pf = path.join(out, 'page.json'); fs.writeFileSync(pf, JSON.stringify(page));
console.log(`${V.id}: ${dur}s, ${N - 1} beats + end card at ${starts[N - 1]}s, style ${style.primary}${style.accent ? ' + ' + style.accent : ''}, audio ${audio || 'none'}\n-> ${pf}`);
