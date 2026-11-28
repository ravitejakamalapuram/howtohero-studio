"""Chant audio for the Sitaram 108 reel: Kokoro Hindi chant takes + code-made tanpura and bells.
Usage: python3 audio.py MODEL.onnx VOICES.bin OUT.wav   (writes beats.json beside it)
All sound is made here; nothing is taken from any other video."""
import sys, json, numpy as np, soundfile as sf, subprocess, os
from kokoro_onnx import Kokoro
SR=48000; N=108; PERIOD=1.65; LEAD=3.0; TAIL=5.0
model,voices,out=sys.argv[1:4]
k=Kokoro(model,voices)
def trim(x,th=0.01):
    i=np.where(np.abs(x)>th)[0]; return x[i[0]:i[-1]+1]
def rs(x,sr):  # resample to SR
    t=np.arange(0,len(x)/sr,1/SR); return np.interp(t,np.arange(len(x))/sr,x)
takes=[]
for v,sp in [('hm_omega',.68),('hm_omega',.74),('hm_psi',.7),('hm_omega',.8)]:
    s,sr=k.create("सीताराम",voice=v,speed=sp,lang='hi'); s=trim(s); s=rs(s,sr)
    s=s/np.max(np.abs(s)); takes.append(s)
total=LEAD+N*PERIOD+TAIL; L=int(total*SR)
voice=np.zeros(L); beats=[]
for i in range(N):
    t=LEAD+i*PERIOD; tk=takes[(i*7)%len(takes)].copy()
    tk=tk[:int(PERIOD*SR*0.95)]; g=0.85+0.15*np.sin(i*1.7)
    if i==N-1: g=1.0
    a=int(t*SR); voice[a:a+len(tk)]+=tk*g; beats.append(round(t,3))
# warm room: two soft echoes
def echo(x,d,g):
    y=x.copy(); n=int(d*SR); y[n:]+=x[:-n]*g; return y
voice=echo(echo(voice,.09,.35),.23,.22)
# tanpura: Pa, Sa, Sa, low Sa plucked in a 6 s cycle (C#3-ish)
f0=138.6
def pluck(f,dur=6.0):
    t=np.arange(int(dur*SR))/SR; y=sum((1/h)*np.sin(2*np.pi*f*h*t+0.3*h)*np.exp(-t*(0.35+0.12*h)) for h in range(1,14))
    y*=1-np.exp(-t*60); return y
tan=np.zeros(L)
cyc=[(1.5,0),(1,1.5),(1,3.0),(.5,4.5)]
for c in range(int(total/6)+1):
    for rat,off in [(1.5,0),(2,1.5),(2,3.0),(1,4.5)]:
        a=int((c*6+off)*SR)
        if a>=L: continue
        p=pluck(f0*rat); e=min(len(p),L-a); tan[a:a+e]+=p[:e]
tan=tan/np.max(np.abs(tan))
# bells at every 27th chant (and a long one at 108)
def bell(dur=4.0,base=880):
    t=np.arange(int(dur*SR))/SR
    return sum(a*np.sin(2*np.pi*base*r*t)*np.exp(-t*d) for a,r,d in [(1,1,1.1),(.6,2.76,1.6),(.4,5.4,2.4),(.3,8.9,3.2)])
bells=np.zeros(L)
for n_ in (27,54,81,108):
    a=int((LEAD+(n_-1)*PERIOD+0.1)*SR); b=bell(5 if n_==108 else 3.2); e=min(len(b),L-a); bells[a:a+e]+=b[:e]*(1.0 if n_==108 else .7)
bells/=np.max(np.abs(bells))
mix=voice/np.max(np.abs(voice))*0.8+tan*0.30+bells*0.22
mix=mix/np.max(np.abs(mix))*0.92
fade=int(2*SR); mix[-fade:]*=np.linspace(1,0,fade)
sf.write(out,mix,SR)
json.dump({'duration':round(total,3),'beats':beats,'period':PERIOD,'lead':LEAD,'bells':[27,54,81,108]},open(os.path.join(os.path.dirname(out) or '.','beats.json'),'w'))
print('ok',total)
