#!/usr/bin/env python3
"""Draws an Anaadi YouTube thumbnail (1080x1920 JPEG, under 2 MB) from one clean frame of the episode.

Usage: thumb.py FRAME.png OUT.jpg EPISODE "TEXT LINE 1|TEXT LINE 2" [ACCENT WORD] [--focus 0.45] [--zoom 1.15] [--top]
  FRAME   a frame without captions (the episode's frame-*.png or a still from a clip), the clearest single character
  TEXT    2 to 4 Telugu words that make people curious; | breaks the line; no question mark
  ACCENT  the one word drawn in gold (must appear in TEXT)
  --focus where the picture sits vertically, 0 = top, 1 = bottom (default 0.45)
  --top   put the words near the top instead of the bottom, when the character is low in the picture
  --zoom  enlarge the picture around the focus point so the character fills the frame (default 1.15)
Rules: "Thumbnails" in SKILL.md. Look at the result at 160 px wide before using it.
"""
import json, os, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
args = [a for a in sys.argv[1:]]
top = '--top' in args
args = [a for a in args if a != '--top']
opt = {'--focus': 0.45, '--zoom': 1.15}
for k in opt:
    if k in args:
        i = args.index(k); opt[k] = float(args[i + 1]); del args[i:i + 2]
focus, zoom = opt['--focus'], opt['--zoom']
frame, out, ep, text = args[:4]
accent = args[4] if len(args) > 4 else ''
tmp = tempfile.mkdtemp()
json.dump({'frame': os.path.abspath(frame), 'out': os.path.abspath(out), 'ep': ep, 'lines': text.split('|'),
           'accent': accent, 'focus': focus, 'zoom': zoom, 'top': top, 'fonts': HERE + '/fonts'}, open(tmp + '/t.json', 'w'), ensure_ascii=False)
js = r"""
const {chromium}=require('playwright');const fs=require('fs');const o=JSON.parse(fs.readFileSync(process.argv[2]));
const b64=f=>fs.readFileSync(f).toString('base64');
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
const line=l=>l.split(' ').map(w=>w===o.accent?`<em>${esc(w)}</em>`:esc(w)).join(' ');
const css=`@font-face{font-family:R;src:url(data:font/ttf;base64,${b64(o.fonts+'/Ramabhadra.ttf')})}
@font-face{font-family:M;src:url(data:font/ttf;base64,${b64(o.fonts+'/Mandali.ttf')})}
body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#000}
.bg{position:absolute;inset:0;background:url(data:image/png;base64,${b64(o.frame)}) center ${o.focus*100}%/cover;transform:scale(${o.zoom});transform-origin:50% ${o.focus*100}%;filter:saturate(1.25) contrast(1.08)}
.top{position:absolute;left:0;right:0;top:0;height:420px;background:linear-gradient(#000c,#0000)}
.bot{position:absolute;left:0;right:0;bottom:0;height:900px;background:linear-gradient(#0000,#000a 35%,#000e)}
.toptext .top{height:900px;background:linear-gradient(#000e,#000a 65%,#0000)}.toptext .bot{display:none}
.chip{position:absolute;top:110px;left:0;right:0;text-align:center}
.chip span{font-family:M;font-size:50px;color:#1a1030;background:#f6d77a;padding:10px 38px 6px;border-radius:40px;box-shadow:0 6px 30px #000}
.t{position:absolute;left:50px;right:50px;bottom:300px;text-align:center;font-family:R;font-size:150px;line-height:1.22;color:#fff;
 -webkit-text-stroke:10px #120a24;paint-order:stroke fill;text-shadow:0 10px 0 #120a24,0 0 50px #000}
.t em{font-style:normal;color:#ffc93c}`;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.setContent(`<style>${css}</style><div class=${o.top?'toptext':''}><div class=bg></div><div class=top></div><div class=bot></div>
<div class=chip><span>అనాది · భాగం ${o.ep}</span></div></div><div class=t style="${o.top?'top:300px;bottom:auto':''}">${o.lines.map(line).join('<br>')}</div>`);
await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(150);
await p.screenshot({path:o.out,type:'jpeg',quality:88});await b.close();})();
"""
open(tmp + '/t.js', 'w').write(js)
subprocess.run(['node', tmp + '/t.js', tmp + '/t.json'], check=True)
size = os.path.getsize(out)
if size > 2 * 1024 * 1024: sys.exit(f'{out} is {size} bytes, over the 2 MB YouTube limit')
print(out, size)
