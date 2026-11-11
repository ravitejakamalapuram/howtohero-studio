#!/usr/bin/env python3
"""Finalizes and verifies each How To Hero video.
1) remux: copy the video stream, encode audio as AAC stereo 48 kHz, faststart -> final file name
2) ffprobe: size, fps, codecs, pixel format, duration, audio channels / rate, file size
3) audio: peak level (must stay below 0 dBFS, no clipping)
4) screenshots at 2 s, 30 s and the last 5 s
5) safe-zone audit: every 0.5 s, bright (text/diagram/UI) pixels must be inside x 60..940, y 420..1500
   (the progress bar on the bottom edge, y >= 1900, is the one allowed exception)
"""
import json, subprocess, sys, os, re
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "out")
FILES = {f[:-5]: json.load(open(os.path.join(ROOT, "videos", f)))["file"] for f in os.listdir(os.path.join(ROOT, "videos")) if f.endswith(".json")}
MAXS = {f[:-5]: json.load(open(os.path.join(ROOT, "videos", f))).get("maxSeconds", 60) for f in os.listdir(os.path.join(ROOT, "videos")) if f.endswith(".json")}  # per-video length cap in seconds; 2 s tolerated
BRIGHT = 120  # luma above this is "content"; the navy background and 7% dot texture stay well below


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def probe(path):
    j = json.loads(run(["ffprobe", "-v", "error", "-show_entries", "format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt,channels,sample_rate,profile", "-of", "json", path]).stdout)
    v = next(s for s in j["streams"] if s["codec_type"] == "video"); a = next(s for s in j["streams"] if s["codec_type"] == "audio")
    n, d = v["r_frame_rate"].split("/")
    return {"w": v["width"], "h": v["height"], "fps": round(int(n) / int(d), 3), "vcodec": v["codec_name"], "pix": v["pix_fmt"], "acodec": a["codec_name"], "ach": a["channels"], "ar": a["sample_rate"], "dur": float(j["format"]["duration"]), "mb": int(j["format"]["size"]) / 1e6}


def peak_db(path):
    r = run(["ffmpeg", "-hide_banner", "-i", path, "-af", "volumedetect", "-vn", "-f", "null", "-"]).stderr
    mx = re.search(r"max_volume: (-?[\d.]+) dB", r); mean = re.search(r"mean_volume: (-?[\d.]+) dB", r)
    return float(mx.group(1)), float(mean.group(1))


def audit(path, dur, shotdir):
    bad = []
    n = int(dur / 0.5)
    for i in range(n):
        t = i * 0.5 + 0.25
        png = os.path.join(shotdir, "_tmp.png")
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", path, "-frames:v", "1", "-vf", "scale=540:960", png])
        im = Image.open(png).convert("L"); W, H = im.size; px = im.load(); sx, sy = 1080 / W, 1920 / H
        hits = {}
        for y in range(H):
            Y = y * sy
            for x in range(W):
                if px[x, y] > BRIGHT:
                    X = x * sx
                    if Y >= 1900: continue  # progress bar
                    z = "top" if Y < 420 else "bottom" if Y > 1500 else "left" if X < 60 else "right" if X > 940 else None
                    if z: hits[z] = hits.get(z, 0) + 1
        if hits: bad.append((round(t, 2), hits))
    return bad


def main(ids):
    os.makedirs(os.path.join(OUT, "shots"), exist_ok=True)
    report = {}
    for v in ids:
        raw = os.path.join(OUT, f"{v}.raw.mp4"); fin = os.path.join(OUT, FILES[v])
        r = run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-c:v", "copy", "-c:a", "aac", "-ac", "2", "-ar", "48000", "-b:a", "192k", "-movflags", "+faststart", fin])
        if r.returncode: print(v, "remux failed", r.stderr[:300]); continue
        info = probe(fin); mx, mean = peak_db(fin)
        base = FILES[v].replace(".mp4", ""); shots = os.path.join(OUT, "shots")
        for label, t in [("2s", 2), ("30s", 30), ("last5", max(0, info["dur"] - 5))]:
            run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", fin, "-frames:v", "1", os.path.join(shots, f"{base}_{label}.png")])
        bad = audit(fin, info["dur"], shots)
        report[v] = {"file": FILES[v], **info, "peak_db": mx, "mean_db": mean, "safe_zone_violations": bad}
        ok = (info["w"], info["h"]) == (1080, 1920) and abs(info["fps"] - 30) < 0.01 and info["vcodec"] == "h264" and info["acodec"] == "aac" and info["ach"] == 2 and info["dur"] <= MAXS[v] + 2 and info["mb"] < 100 and mx < -0.5 and not bad
        print(f"{FILES[v]}: {info['w']}x{info['h']} {info['fps']}fps {info['vcodec']}/{info['pix']} + {info['acodec']} {info['ach']}ch {info['ar']}Hz | {info['dur']:.2f}s | {info['mb']:.1f} MB | peak {mx} dB mean {mean} dB | safe-zone violations: {len(bad)} {'OK' if ok else 'CHECK'}")
        for b in bad[:6]: print("   ", b)
    json.dump(report, open(os.path.join(OUT, "report.json"), "w"), indent=1)


main(sys.argv[1:] or list(FILES))
