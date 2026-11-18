// node render.cjs <page.json> <out.mp4> [--style slug] [--accent slug|none] [--audio file] [--fps 30]
//   --accent <slug> draws the chart, map and timeline beats with that kit, also on a page built without one
// node render.cjs <page.json> <out prefix> --frames 0.5,12,58     writes <out prefix>-<t>.png stills instead
// Serves this folder on a local port, opens engine/page.html in headless Chromium, steps seek(t) and pipes frames to ffmpeg.
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs'), http = require('http');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2' };
(async () => {
  const args = process.argv.slice(2), [data, out] = args, opt = n => { const i = args.indexOf('--' + n); return i < 0 ? null : args[i + 1]; };
  if (!out || !fs.existsSync(data)) { console.error('usage: node render.cjs <page.json> <out.mp4 | out prefix --frames 0.5,12> [--style slug] [--accent slug|none] [--audio file] [--fps 30]'); process.exit(1); }
  const page = JSON.parse(fs.readFileSync(data, 'utf8')), audio = opt('audio') || page.audio, fps = +(opt('fps') || 30), frames = opt('frames');
  if (!frames && audio && !fs.existsSync(audio)) { console.error('voice track not found: ' + audio + ' (pass --audio <file>)'); process.exit(1); }
  const over = {}; if (opt('style')) over.primary = opt('style'); if (opt('accent')) over.accent = opt('accent');
  const srv = http.createServer((q, s) => {
    const u = q.url.split('?')[0], f = u === '/__data.json' ? data : path.join(__dirname, path.normalize(u));
    fs.readFile(f, (e, buf) => { if (e) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); s.end(buf); });
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const b = await chromium.launch(), pg = await b.newPage();
  pg.on('pageerror', e => { console.error('PAGEERR', e.message); process.exit(1); }); pg.on('console', m => console.log('LOG', m.text()));
  await pg.goto(`http://127.0.0.1:${srv.address().port}/engine/page.html`);
  await pg.waitForFunction(() => window.boot);
  const dur = await pg.evaluate(o => window.boot(o), over);
  const el = await pg.$('canvas'), box = await el.boundingBox(); await pg.setViewportSize({ width: box.width, height: box.height });
  const done = async () => { await b.close(); srv.close(); };
  if (frames) { for (const t of frames.split(',')) { await pg.evaluate(t => window.seek(t), +t); await el.screenshot({ path: `${out}-${t}.png` }); } return done(); }
  const n = Math.ceil(dur * fps), ff = ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-'];
  if (audio) ff.push('-i', audio);
  ff.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(fps));
  if (audio) ff.push('-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2');
  ff.push('-t', String(dur), '-movflags', '+faststart', out);
  const p = spawn('ffmpeg', ff, { stdio: ['pipe', 'inherit', 'inherit'] }), t0 = Date.now();
  // if ffmpeg dies (bad output path, bad audio) stop at once instead of waiting on a closed pipe
  const closed = new Promise(r => p.on('close', r)); p.stdin.on('error', () => {});
  p.on('close', code => { if (code) { console.error('ffmpeg failed, exit ' + code); process.exit(1); } });
  for (let i = 0; i < n; i++) {
    await pg.evaluate(t => window.seek(t), i / fps);
    const buf = await el.screenshot({ type: 'jpeg', quality: 90 });
    if (!p.stdin.write(buf)) await new Promise(r => p.stdin.once('drain', r));
    if (i % 600 === 0) console.log(path.basename(out), i, '/', n, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  p.stdin.end(); await closed; await done(); console.log('done', out, ((Date.now() - t0) / 1000).toFixed(0) + 's');
})();
