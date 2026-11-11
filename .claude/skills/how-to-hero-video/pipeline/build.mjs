// Usage: node build.mjs <videoId>   (v1..v5)
// Reads videos/<id>.json + videos/<id>.scenes.js. The story is written as one continuous narration: each line is one beat,
// beats follow each other with a short gap, and the voice speed is fitted so the whole video lands near the target length.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const id = process.argv[2], ROOT = path.dirname(new URL(import.meta.url).pathname);
const V = JSON.parse(fs.readFileSync(path.join(ROOT, "videos", id + ".json"), "utf8"));
const WID = JSON.parse(fs.readFileSync(path.join(ROOT, "lib", "widths.json"), "utf8"));
const dir = path.join(ROOT, "work", id);
if (!fs.existsSync(dir)) fs.cpSync(path.join(ROOT, "work", "_base"), dir, { recursive: true });
fs.mkdirSync(path.join(dir, "assets"), { recursive: true });
fs.copyFileSync(path.join(ROOT, "lib", "anton.woff2"), path.join(dir, "assets", "anton.woff2"));
process.chdir(dir);

const VOICE = "af_heart", GAP = 0.26, TARGET = V.target || 58, LEAD = 0.35, TAIL = 1.0;
const tts = (s) => s.replace(/\bUPI\b/g, "U P I").replace(/\bNPCI\b/g, "N P C I").replace(/\bGPS\b/g, "G P S").replace(/\b3D\b/g, "three D").replace(/\bQR\b/g, "Q R");
const dur = (f) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim();
function speak(text, file, speed) {
  const key = file.replace(".wav", ".key"), k = [text, VOICE, speed.toFixed(3)].join("|");
  if (fs.existsSync(file) && fs.existsSync(key) && fs.readFileSync(key, "utf8") === k) return;
  execFileSync("npx", ["hyperframes", "tts", tts(text), "-v", VOICE, "-s", speed.toFixed(3), "-o", file], { stdio: "pipe" });
  fs.writeFileSync(key, k);
}
const N = V.beats.length, file = (i) => `assets/v${i + 1}.wav`;
const run = (speed) => V.beats.map((b, i) => { speak(b.say, file(i), speed); return dur(file(i)); });
let speed = 1.0, ds = run(speed);
const avail = TARGET - LEAD - (N - 1) * GAP - TAIL;
const want = Math.min(1.1, Math.max(0.92, (ds.reduce((a, b) => a + b, 0) * speed) / avail));
if (Math.abs(want - speed) > 0.02) { speed = +want.toFixed(3); ds = run(speed); }

let t = LEAD;
const lines = V.beats.map((b, i) => { const o = { start: +t.toFixed(3), dur: +ds[i].toFixed(3), end: +(t + ds[i]).toFixed(3), cap: b.say, words: b.say.split(/\s+/).length }; t += ds[i] + GAP; return o; });
const end = +Math.min(61.9, Math.max(55, lines[N - 1].end + TAIL)).toFixed(2);
const beats = lines.map((l, i) => ({ a: i ? +(l.start - 0.15).toFixed(3) : 0, b: i < N - 1 ? +(lines[i + 1].start - 0.15).toFixed(3) : end }));

// hook size: as large as fits 2 lines inside x 60..940 (max 112), never below 90 (tighten tracking slightly if needed)
const tw = (s, size, track = 0) => [...s].reduce((n, ch) => n + (WID[ch] ?? 50), 0) * size / 100 + track * s.length;
let size = 112, track = 0;
while (size > 90 && V.hook.lines.some((l) => tw(l, size) > 868)) size -= 2;
const widest = V.hook.lines.reduce((m, l) => (tw(l, size) > tw(m, size) ? l : m), V.hook.lines[0]);
if (tw(widest, size) > 868) track = -((tw(widest, size) - 866) / widest.length);
const hook = { ...V.hook, size, track: +track.toFixed(2) };
const CFG = { hook, beats, lines, end, card: V.card };
fs.writeFileSync("timing.json", JSON.stringify(CFG, null, 1));

// quiet sound bed: soft pad + gentle pops on every beat, a small chime on the end card
{
  const sr = 44100, Nn = Math.ceil(end * sr), buf = new Float32Array(Nn), hz = (m) => 440 * 2 ** ((m - 69) / 12), TAU = Math.PI * 2;
  const add = (t0, len, fn) => { const n0 = Math.floor(t0 * sr); for (let i = 0; i < len * sr && n0 + i < Nn; i++) if (n0 + i >= 0) buf[n0 + i] += fn(i / sr); };
  const pad = (t, len, ms, a) => ms.forEach((m) => { const f = hz(m); add(t, len, (x) => a * Math.min(1, x / 1.2, (len - x) / 1.2) * (Math.sin(TAU * f * x) + 0.5 * Math.sin(TAU * f * 1.003 * x))); });
  const pluck = (t, m, a, dec = 0.3) => { const f = hz(m); add(t, dec * 4, (x) => a * Math.min(1, x * 400) * Math.exp((-x / dec) * 3) * (Math.sin(TAU * f * x) + 0.35 * Math.sin(2 * TAU * f * x))); };
  const chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
  for (let tt = 0, i = 0; tt < end; tt += 6, i++) pad(tt, 7, chords[i % 4], 0.03);
  beats.forEach((b, i) => pluck(b.a + 0.05, 76 + (i % 4) * 2, 0.07, 0.25));
  pluck(beats[N - 1].a + 0.3, 88, 0.06, 0.9); pluck(beats[N - 1].a + 0.45, 93, 0.05, 1.0);
  let peak = 0; for (let n = 0; n < Nn; n++) { buf[n] *= Math.min(1, n / sr / 0.5, Math.max(0, (end - n / sr) / 1.0)); peak = Math.max(peak, Math.abs(buf[n])); }
  const wav = Buffer.alloc(44 + Nn * 4);
  wav.write("RIFF", 0); wav.writeUInt32LE(36 + Nn * 4, 4); wav.write("WAVEfmt ", 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(sr, 24); wav.writeUInt32LE(sr * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write("data", 36); wav.writeUInt32LE(Nn * 4, 40);
  for (let n = 0; n < Nn; n++) { const v = Math.round((buf[n] / peak) * 0.7 * 32767); wav.writeInt16LE(v, 44 + n * 4); wav.writeInt16LE(v, 46 + n * 4); }
  fs.writeFileSync("assets/bed.wav", wav);
}

const audio = [`<audio id="bed" class="clip" src="assets/bed.wav" data-start="0" data-duration="${end}" data-track-index="1" data-volume="0.35"></audio>`]
  .concat(lines.map((l, i) => `<audio id="vo${i + 1}" class="clip" src="assets/v${i + 1}.wav" data-start="${l.start}" data-duration="${l.dur}" data-track-index="2" data-volume="1"></audio>`)).join("\n      ");
const rd = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const html = rd("lib/head.html").replace("__DUR__", end).replace("__CFG__", JSON.stringify(CFG)).replace("__WIDTHS__", JSON.stringify(WID)).replace("__AUDIO__", audio)
  .replace("__LIB__", () => rd("lib/lib.js")).replace("__SCENES__", () => rd(`videos/${id}.scenes.js`)).replace("__FINISH__", () => rd("lib/finish.js"));
fs.writeFileSync("index.html", html);
console.log(id, "end", end, "s | beats", N, "| words", lines.reduce((n, l) => n + l.words, 0), "| speed", speed, "| line durations", lines.map((l) => l.dur.toFixed(1)).join(" "), "| hook", size + "px");
