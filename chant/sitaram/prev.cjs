const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path=require('path');
(async()=>{const S=process.argv[2];const fps=15,dur=13;const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1080,height:1920}});
pg.on('pageerror',e=>{console.error('PAGEERR',S,e.message);process.exit(1)});
await pg.goto('file://'+path.resolve('styles.html')+'?s='+S);await pg.evaluate(()=>Promise.all([document.fonts.load('800 50px Mukta'),document.fonts.load('600 50px MuktaL'),document.fonts.load('50px Rama')]));
if(process.argv[3]==='shot'){for(const t of [3,8,12.5]){await pg.evaluate(t=>window.seek(t),t);await pg.screenshot({path:`/tmp/sr/p${S}_${t}.png`})}await b.close();return}
const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-framerate',String(fps),'-i','-','-vf','scale=720:-2','-c:v','libx264','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',`/tmp/sr/prev-${S}.mp4`],{stdio:['pipe','inherit','inherit']});
for(let i=0;i<dur*fps;i++){await pg.evaluate(t=>window.seek(t),i/fps);const buf=await pg.screenshot({type:'jpeg',quality:85});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r))}
ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();console.log('done',S)})()
