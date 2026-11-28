// usage: node render.cjs page.html beats.json out.mp4 audio.wav [fps]
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
(async () => {
  const [html, beatsF, out, audio, fpsA] = process.argv.slice(2); const fps = +(fpsA || 30);
  const B = JSON.parse(fs.readFileSync(beatsF));
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  pg.on('pageerror', e => { console.error('PAGEERR', e.message); process.exit(1); });
  await pg.addInitScript(t => { window.BEATS = t; }, B);
  await pg.goto('file://' + path.resolve(html)); await pg.evaluate(() => document.fonts.load('800 50px Mukta')); await pg.evaluate(() => document.fonts.load('600 50px MuktaL')); await pg.evaluate(() => document.fonts.load('50px Rama')); await pg.evaluate(() => document.fonts.ready);
  const n = Math.ceil(B.duration * fps);
  const args = ['-v','error','-y','-f','image2pipe','-framerate',String(fps),'-i','-','-i',audio,'-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','-r',String(fps),'-c:a','aac','-b:a','160k','-ar','48000','-ac','2','-shortest','-movflags','+faststart', out];
  const ff = spawn('ffmpeg', args, { stdio: ['pipe','inherit','inherit'] }); const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await pg.evaluate(t => window.seek(t), i / fps);
    const buf = await pg.screenshot({ type: 'jpeg', quality: 90 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 600 === 0) console.log(i, '/', n, ((Date.now()-t0)/1000).toFixed(0)+'s');
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('done', ((Date.now()-t0)/1000).toFixed(0)+'s');
})();
