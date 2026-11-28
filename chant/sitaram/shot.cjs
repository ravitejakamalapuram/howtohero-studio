const { chromium } = require('playwright'); const path=require('path'),fs=require('fs');
(async()=>{const B=JSON.parse(fs.readFileSync(process.argv[2]));const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1080,height:1920}});
pg.on('pageerror',e=>console.error('PAGEERR',e.message));await pg.addInitScript(t=>{window.BEATS=t},B);await pg.goto('file://'+path.resolve(process.argv[3]));
await pg.evaluate(()=>Promise.all([document.fonts.load('800 50px Mukta'),document.fonts.load('600 50px MuktaL'),document.fonts.load('50px Rama')]));
for(const t of process.argv.slice(4)){await pg.evaluate(t=>window.seek(t),+t);await pg.screenshot({path:`/tmp/sr/s_${t}.png`})}await b.close()})()
