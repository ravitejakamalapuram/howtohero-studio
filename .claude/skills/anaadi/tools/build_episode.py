#!/usr/bin/env python3
"""Join an Anaadi episode: clips + voice + Telugu captions + source tags + drone.

Usage: build_episode.py EPISODE_DIR
EPISODE_DIR holds script.json ([{id, te}]), wav/<id>.wav, the clips and build.json:
{
  "out": "anaadi-ep01.mp4",
  "segments": [{"clip": "clip-A.mp4", "lines": [0, 1], "pingpong": true, "start": 0.0}],
  "tags": [{"text": "...", "segment": 0}],
  "episode": {"label": "భాగం 1", "title": "సృష్టికి ముందు"},
  "brandLine": 5
}
"episode" shows a title card for the first 3 seconds and adds the label to the end card;
"top" (pixels, default 300) moves the card when it would cover a face.
A segment may carry "sfx": "ocean" | "shimmer" | "deep" | "wind", a soft code-made sound under the voice.
A segment lasts as long as its lines. A clip that is too short is slowed (up to 1.4x)
or, with "pingpong", played backwards then forwards (only for shots with no characters).
Captions change at the real pauses in the voice.
"""
import json, os, re, subprocess, sys, tempfile, wave

HERE = os.path.dirname(os.path.abspath(__file__))
GAP, LEAD, TAIL, XF = 0.35, 0.3, 0.8, 0.4

def wav_len(p):
    w = wave.open(p); return w.getnframes() / w.getframerate()

def pauses(p):
    """Mid-points of the silences inside a wav, longest first."""
    r = subprocess.run(['ffmpeg', '-v', 'info', '-i', p, '-af', 'silencedetect=noise=-32dB:d=0.12',
                        '-f', 'null', '-'], capture_output=True, text=True).stderr
    s = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', r)]
    e = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r)]
    d = wav_len(p)
    out = [((a + b) / 2, b - a) for a, b in zip(s, e) if a > 0.25 and b < d - 0.25]
    return sorted(out, key=lambda x: -x[1])

def split_line(text):
    parts = [x.strip() for x in re.split(r'(?<=[.?!,])\s+', text) if x.strip()]
    m = []
    for x in parts:
        if m and len(m[-1]) < 14: m[-1] += ' ' + x
        else: m.append(x)
    return m

def timeline(ep, lines):
    t, caps, starts = LEAD, [], {}
    for l in lines:
        p = f"{ep}/wav/{l['id']}.wav"; d = wav_len(p); starts[l['id']] = (t, d)
        parts = split_line(l['te']); cuts = sorted(x[0] for x in pauses(p)[:len(parts) - 1])
        if len(cuts) < len(parts) - 1:            # not enough pauses: share by length
            tot = sum(len(x) for x in parts); c, cuts = 0, []
            for x in parts[:-1]: c += d * len(x) / tot; cuts.append(c)
        edges = [0] + cuts + [d]
        for i, x in enumerate(parts):
            caps.append({'text': x, 's': round(t + edges[i], 2), 'e': round(t + edges[i + 1], 2)})
        t += d + GAP
    return caps, starts, round(t - GAP + TAIL, 2)

def render_overlays(tmp, caps, tags, brand, epi):
    json.dump({'caps': [c['text'] for c in caps], 'tags': tags, 'brand': brand, 'epi': epi, 'fonts': HERE + '/fonts'},
              open(tmp + '/ov.json', 'w'), ensure_ascii=False)
    js = r"""
const {chromium}=require('playwright');const fs=require('fs');const o=JSON.parse(fs.readFileSync(process.argv[2]+'/ov.json'));
const b64=f=>fs.readFileSync(o.fonts+'/'+f).toString('base64');
const css=`@font-face{font-family:R;src:url(data:font/ttf;base64,${b64('Ramabhadra.ttf')})}@font-face{font-family:M;src:url(data:font/ttf;base64,${b64('Mandali.ttf')})}
html,body{margin:0;width:1080px;height:1920px;background:transparent}
.cap{position:absolute;left:70px;right:70px;bottom:330px;text-align:center;font-family:R;font-size:76px;line-height:1.35;color:#fff7dc;text-shadow:0 0 18px #000,0 4px 0 #1a1030,0 0 40px rgba(0,0,0,.9);-webkit-text-stroke:2px rgba(20,10,40,.55);paint-order:stroke fill}
.tag{position:absolute;left:60px;right:60px;top:150px;text-align:center;font-family:M;font-size:34px;color:#f3d98a;text-shadow:0 0 10px #000,0 2px 6px #000}
.tag span{display:inline-block;line-height:1.5;background:rgba(10,8,30,.55);padding:10px 22px;border-radius:26px;border:1px solid rgba(243,217,138,.5)}
.epi{position:absolute;left:0;right:0;top:300px;text-align:center;font-family:R;color:#f6d77a;text-shadow:0 0 24px #000,0 0 50px rgba(0,0,0,.8)}.epi b{display:block;font-size:150px;font-weight:400;line-height:1.1}.epi i{display:inline-block;font-style:normal;font-family:M;font-size:52px;color:#fff7dc;margin-top:18px;padding:8px 34px;border-top:2px solid rgba(246,215,122,.7);border-bottom:2px solid rgba(246,215,122,.7)}
.brand small{display:block;font-family:M;font-size:44px;color:#fff7dc;margin-top:6px}
.brand{position:absolute;left:0;right:0;top:230px;text-align:center;font-family:R;font-size:120px;color:#f6d77a;text-shadow:0 0 30px #000,0 0 60px rgba(246,215,122,.5)}`;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
const shot=async(h,f)=>{await p.setContent(`<style>${css}</style>${h}`);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(120);await p.screenshot({path:process.argv[2]+'/'+f,omitBackground:true});};
for(let i=0;i<o.caps.length;i++)await shot(`<div class=cap>${o.caps[i]}</div>`,`cap${i}.png`);
for(let i=0;i<o.tags.length;i++)await shot(`<div class=tag><span>${o.tags[i]}</span></div>`,`tag${i}.png`);
await shot(`<div class=brand>${o.brand}${o.epi?`<small>${o.epi.label}</small>`:''}</div>`,'brand.png');if(o.epi)await shot(`<div class=epi style="top:${o.epi.top||300}px"><b>${o.epi.label}</b><i>${o.epi.title}</i></div>`,'epi.png');await b.close();})();
"""
    open(tmp + '/ov.cjs', 'w').write(js)
    subprocess.run(['node', tmp + '/ov.cjs', tmp], check=True)

def main(ep):
    ep = ep.rstrip('/'); cfg = json.load(open(ep + '/build.json')); lines = json.load(open(ep + '/script.json'))
    caps, starts, total = timeline(ep, lines)
    segs = cfg['segments']
    # a segment starts half a gap before its first line; the first starts at 0
    cut = [0.0] + [round(starts[s['lines'][0]][0] - GAP / 2, 2) for s in segs[1:]] + [total]
    tmp = tempfile.mkdtemp()
    tags = cfg.get('tags', [])
    epi = cfg.get('episode')
    render_overlays(tmp, caps, [t['text'] for t in tags], cfg.get('brand', 'అనాది'), epi)
    inp, fc, sc = [], [], "scale=1080:1920:flags=lanczos,fps=30,setsar=1,format=yuv420p"
    for i, s in enumerate(segs):
        inp += ['-i', f"{ep}/{s['clip']}"]
        need = cut[i + 1] - cut[i] + (XF if i < len(segs) - 1 else 0)
        st = s.get('start', 0); have = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
              '-of', 'csv=p=0', f"{ep}/{s['clip']}"], capture_output=True, text=True).stdout) - st - 0.1
        end = f"tpad=stop_mode=clone:stop_duration=2,trim=0:{need:.2f},setpts=PTS-STARTPTS,fps=30,settb=1/30[S{i}]"
        if need <= have:
            fc.append(f"[{i}:v]{sc},trim=start={st},setpts=PTS-STARTPTS,{end}")
        elif s.get('pingpong'):
            k = max(need / (2 * have), 1.0)   # still too short after there-and-back: slow it a little
            fc.append(f"[{i}:v]{sc},split[f{i}][r{i}];[r{i}]reverse[q{i}];[q{i}][f{i}]concat=n=2:v=1,setpts={k:.3f}*PTS,{end}")
        else:
            k = need / have
            if k > 1.4: sys.exit(f"segment {i}: clip is {have:.1f}s but its lines need {need:.1f}s; add a clip or mark pingpong")
            fc.append(f"[{i}:v]trim=start={st},setpts={k:.3f}*(PTS-STARTPTS),{sc},{end}")
    cur = 'S0'
    for i in range(1, len(segs)):
        fc.append(f"[{cur}][S{i}]xfade=transition=fade:duration={XF}:offset={cut[i] - XF / 2:.2f}[X{i}]"); cur = f'X{i}'
    fc.append(f"[{cur}]fade=t=in:d=0.5,fade=t=out:st={total - 0.6:.2f}:d=0.6[v0]"); cur = 'v0'
    ov = [(f'cap{i}.png', c['s'], c['e']) for i, c in enumerate(caps)]
    for i, t in enumerate(tags):
        g = t['segment']; ov.append((f'tag{i}.png', cut[g] + (3.6 if epi and g == 0 else 0.6), cut[g + 1] - 0.6))
    if epi: ov.append(('epi.png', 0.3, 3.3))
    if 'brandLine' in cfg:
        b0 = starts[cfg['brandLine']][0]
        if 'brandSecs' in cfg: b0 = max(b0, total - cfg['brandSecs'])  # long last line: card only at the end
        ov.append(('brand.png', b0, total))
    n = len(segs)
    for k, (f, s, e) in enumerate(ov):
        inp += ['-i', f'{tmp}/{f}']; d = 0.18
        fc.append(f"[{n + k}:v]format=rgba,loop=loop=-1:size=1,trim=0:{e - s + 0.01:.2f},fade=t=in:d={d}:alpha=1,"
                  f"fade=t=out:st={e - s - d:.2f}:d={d}:alpha=1,setpts=PTS-STARTPTS+{s}/TB[o{k}]")
        fc.append(f"[{cur}][o{k}]overlay=0:0:enable='between(t,{s},{e})':eof_action=pass[v{k + 1}]"); cur = f'v{k + 1}'
    a0, am = n + len(ov), []
    for j, l in enumerate(lines):
        inp += ['-i', f"{ep}/wav/{l['id']}.wav"]
        fc.append(f"[{a0 + j}:a]aresample=48000,adelay={int(starts[l['id']][0] * 1000)}:all=1,volume=1.6[a{j}]"); am.append(f'[a{j}]')
    fc.append(f"sine=f=130.81:d={total}:r=48000,volume=0.5[s1];sine=f=196.0:d={total}:r=48000,volume=0.35[s2];"
              f"sine=f=261.63:d={total}:r=48000,volume=0.22[s3];sine=f=392.4:d={total}:r=48000,volume=0.08[s4];"
              f"[s1][s2][s3][s4]amix=inputs=4:normalize=0,tremolo=f=0.25:d=0.35,aecho=0.8:0.7:120|260:0.4|0.3,"
              f"lowpass=f=1800,volume=0.16,afade=t=in:d=2,afade=t=out:st={total - 2.5}:d=2.5[mus]")
    SFX = {'ocean': "anoisesrc=c=pink:r=48000:d={d},lowpass=f=700,highpass=f=80,tremolo=f=0.13:d=0.8,volume=0.55",
           'wind': "anoisesrc=c=brown:r=48000:d={d},bandpass=f=420:w=300,tremolo=f=0.2:d=0.6,volume=0.9",
           'deep': "sine=f=55:r=48000:d={d},tremolo=f=0.4:d=0.5,volume=0.35",
           'shimmer': "sine=f=1318.5:r=48000:d={d}[h1];sine=f=1975.5:r=48000:d={d}[h2];sine=f=2637:r=48000:d={d}[h3];"
                      "[h1][h2][h3]amix=inputs=3:normalize=0,tremolo=f=6:d=0.7,aecho=0.8:0.8:180|340:0.5|0.35,volume=0.035"}
    for i, sg in enumerate(segs):
        if sg.get('sfx') in SFX:
            d = cut[i + 1] - cut[i] + 0.6; a = max(cut[i] - 0.3, 0)
            fc.append(SFX[sg['sfx']].format(d=f'{d:.2f}') + f",afade=t=in:d=0.8,afade=t=out:st={d - 0.9:.2f}:d=0.9,"
                      f"adelay={int(a * 1000)}:all=1[fx{i}]"); am.append(f'[fx{i}]')
    fc.append(''.join(am) + f"[mus]amix=inputs={len(am) + 1}:normalize=0,alimiter=limit=0.95,apad,atrim=0:{total}[aout]")
    out = f"{ep}/{cfg.get('out', 'episode.mp4')}"
    subprocess.run(['ffmpeg', '-v', 'error', '-y'] + inp + ['-filter_complex', ';'.join(fc), '-map', f'[{cur}]', '-map', '[aout]',
                    '-t', str(total), '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p',
                    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', out], check=True)
    json.dump({'caps': caps, 'cuts': cut, 'total': total}, open(ep + '/timeline.json', 'w'), ensure_ascii=False, indent=1)
    print(out, total)

if __name__ == '__main__':
    main(sys.argv[1])
