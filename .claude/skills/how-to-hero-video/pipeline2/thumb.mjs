// node thumb.mjs <video.mp4> <out.jpg> --text "MARS ROCKS|CRACK LIKE TILES" [--accent TILES] [--at 4.2] [--format short|doc]
// Draws the video's custom thumbnail (cover) from one of its own frames: the frame's drawing, enlarged, under 2-5 huge
// words. No AI images. Rules for the words and the frame are in ../THUMBNAILS.md.
//   --at      second of the frame to use (default 0.5); pick the beat whose drawing is the clearest single object
//   --focus   the height (0-1 of the frame) the enlarged picture centres on, to leave out the hook text
//   --accent  the word drawn in yellow (default the last word)
//   --format  short: 1080x1920 JPG (YouTube Shorts, Instagram cover); doc: 1280x720 (long-form). Default from the video.
// Output is a JPG under 2 MB (YouTube's limit) and under 8 MB (Instagram's).
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import fs from 'fs'; import os from 'os'; import path from 'path'; import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(import.meta.url)('playwright'); // global install, like render.cjs
const args = process.argv.slice(2), [video, out] = args;
const opt = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : args[i + 1]; };
if (!out || !fs.existsSync(video) || !opt('text')) {
  console.error('usage: node thumb.mjs <video.mp4> <out.jpg> --text "LINE 1|LINE 2" [--accent WORD] [--at 0.5] [--format short|doc]');
  process.exit(1);
}
const lines = opt('text').toUpperCase().split('|').map(s => s.trim()).filter(Boolean);
const words = lines.join(' ').split(/\s+/);
if (words.length > 6) { console.error(`thumbnail text has ${words.length} words; keep it to 2-5 (THUMBNAILS.md)`); process.exit(1); }
const accent = (opt('accent') || words[words.length - 1]).toUpperCase();
const at = +opt('at', 0.5);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'thumb-'));
const frame = path.join(tmp, 'frame.png');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(at), '-i', video, '-frames:v', '1', frame]);
const [vw, vh] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', frame])
  .toString().trim().split(',').map(Number);
const fmt = opt('format', vw > vh ? 'doc' : 'short');
const W = fmt === 'doc' ? 1280 : 1080, H = fmt === 'doc' ? 720 : 1920;
// the drawing area of the source frame: the Short safe box (pipeline2), or the doc scene box
const crop = vw > vh ? { x: 120 / 1920, y: 70 / 1080, w: 1680 / 1920, h: 780 / 1080 } : { x: 60 / 1080, y: 200 / 1920, w: 880 / 1080, h: 1160 / 1920 };
const img = 'data:image/png;base64,' + fs.readFileSync(frame).toString('base64');
const anton = 'data:font/woff2;base64,' + fs.readFileSync(path.join(here, '../pipeline/lib/anton.woff2')).toString('base64');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const textHtml = lines.map(l => '<div>' + l.split(' ').map(w => w === accent || w.replace(/[^A-Z0-9]/g, '') === accent.replace(/[^A-Z0-9]/g, '') ? `<span class=a>${esc(w)}</span>` : esc(w)).join(' ') + '</div>').join('');

// Short: words in the upper middle (y 330-820) so they survive Instagram's 3:4 grid crop and sit above the YouTube
// title overlay; the enlarged drawing fills the lower middle. Doc: words on the left half, drawing on the right.
const short = fmt === 'short';
const pic = short ? { x: 40, y: 840, w: 1000, h: 860 } : { x: 600, y: 40, w: 640, h: 640 };
// --focus: the height (0-1 of the frame) the picture centres on; default the middle of the drawing area
const focus = +opt('focus', crop.y + crop.h / 2), imgH = pic.w / crop.w * vh / vw;
const posY = Math.max(0, Math.min(100, (focus * imgH - pic.h / 2) / (imgH - pic.h) * 100));
const fontPx = short ? Math.min(230, Math.floor(1700 / Math.max(...lines.map(l => l.length)))) : Math.min(150, Math.floor(1000 / Math.max(...lines.map(l => l.length))));
const html = `<!doctype html><html><head><style>
@font-face { font-family: Anton; src: url(${anton}); }
html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: #0d1530; }
.bg { position: absolute; inset: -40px; background: url(${img}) center/cover; filter: blur(28px) brightness(.45) saturate(1.4); }
.pic { position: absolute; left: ${pic.x}px; top: ${pic.y}px; width: ${pic.w}px; height: ${pic.h}px; border-radius: 28px; overflow: hidden;
  box-shadow: 0 0 0 6px #FFC531, 0 20px 60px rgba(0,0,0,.6); }
.pic div { position: absolute; inset: 0; background: url(${img}) no-repeat;
  background-size: ${(100 / crop.w).toFixed(2)}% auto; background-position: ${(crop.x / (1 - crop.w) * 100).toFixed(2)}% ${posY.toFixed(2)}%;
  filter: contrast(1.35) saturate(1.5) brightness(1.15); }
.t { position: absolute; ${short ? `left: 50px; right: 50px; top: 330px; height: 490px; text-align: center; align-items: center;` : `left: 40px; width: 540px; top: 40px; height: 640px; text-align: left; align-items: flex-start;`}
  display: flex; flex-direction: column; justify-content: center;
  font: ${fontPx}px/0.98 Anton, Impact, sans-serif; color: #fff; letter-spacing: 1px;
  -webkit-text-stroke: ${Math.round(fontPx / 22)}px #000; paint-order: stroke fill; text-shadow: 0 8px 0 #000, 0 0 40px rgba(0,0,0,.8); }
.a { color: #FFC531; }
.tag { position: absolute; ${short ? 'left: 50%; transform: translateX(-50%); top: 250px;' : 'left: 40px; bottom: 30px;'} font: 44px Anton, sans-serif;
  color: #fff; background: #E5384F; padding: 6px 22px; border-radius: 10px; letter-spacing: 2px; }
</style></head><body><div class=bg></div><div class=pic><div></div></div><div class=t>${textHtml}</div>
${opt('tag') ? `<div class=tag>${esc(opt('tag').toUpperCase())}</div>` : ''}</body></html>`;

const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: W, height: H } });
await pg.setContent(html); await pg.evaluate(() => document.fonts.ready);
// shrink the words until every line fits its box
await pg.evaluate(() => { const t = document.querySelector('.t'); let s = parseFloat(getComputedStyle(t).fontSize);
  while ((t.scrollHeight > t.clientHeight || t.scrollWidth > t.clientWidth) && s > 40) { s -= 4; t.style.fontSize = s + 'px'; } });
for (const q of [90, 80, 70]) {
  await pg.screenshot({ path: out, type: 'jpeg', quality: q });
  if (fs.statSync(out).size < 1.9 * 1024 * 1024) break;
}
await b.close(); fs.rmSync(tmp, { recursive: true, force: true });
console.log(`${out}: ${W}x${H}, ${(fs.statSync(out).size / 1024).toFixed(0)} KB, frame ${at}s`);
