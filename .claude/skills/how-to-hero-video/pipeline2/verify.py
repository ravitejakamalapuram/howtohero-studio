#!/usr/bin/env python3
"""Checks one rendered pipeline2 video. Prints one line per check and exits 1 if any check fails.

  python3 verify.py <page.json> <video.mp4> [--style slug] [--accent slug] [--paper #hex] [--max seconds]

The paper colour and luma (light or dark) of the video's style come from styles/registry.json, so the same
checks work on a white board and on a chalkboard. Give --paper for a style that is not in the registry.

1) file: 1080x1920 (1920x1080 for a doc), 30 fps, h264, an audio stream that is neither clipping nor silent, file size
2) duration: matches page.json, and a Short stays under --max (default 60 s, 2 s tolerated)
3) captions: text against what is right around it is at least 4.5:1, sampled twice in every beat
4) end card: the last frame is on the style's paper and shows the card text and the mascot's red cape
5) opening (Shorts): frame 0 is not empty, and the picture changes in the first 3 s
6) safe zone: every 0.5 s and 0.1 s before each beat ends, nothing that stands out from the paper sits outside the safe zone
   (the progress bar on the bottom edge is allowed; so is anything that never changes, such as a board frame)
"""
import argparse, io, json, os, re, subprocess, sys
from PIL import Image, ImageChops, ImageFilter

ROOT = os.path.dirname(os.path.abspath(__file__))
# the same numbers as FORMATS in engine/engine.js
FORMATS = {"short": dict(W=1080, H=1920, bx=60, by=200, bw=960, bh=1160, capY=1500, capSize=56),
           "doc": dict(W=1920, H=1080, bx=120, by=70, bw=1680, bh=780, capY=962, capSize=46)}
CAPE = (0xE5, 0x38, 0x4F)  # the mascot's cape, the same red in every style (engine/brand.js)
MIN_CAPTION = 4.5          # caption contrast needed
CONTENT = 3.0              # a pixel is "content" when its contrast against the paper is at least this
MARGIN = 10                # pixels a stroke may spill over the edge of the safe zone
MIN_PX = 40                # content pixels (at half size) outside the safe zone before a frame is reported

# ---- colour helpers (WCAG relative luminance and contrast ratio)
LIN = [c / 255 / 12.92 if c / 255 <= 0.04045 else ((c / 255 + 0.055) / 1.055) ** 2.4 for c in range(256)]

def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def lum(rgb):
    return 0.2126 * LIN[rgb[0]] + 0.7152 * LIN[rgb[1]] + 0.0722 * LIN[rgb[2]]

def ratio(l1, l2):
    """contrast ratio of two luminances, 1..21"""
    return (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05)

def contrast(a, b):
    return ratio(lum(a), lum(b))

def luma_of(paper):
    return "light" if lum(paper) > 0.18 else "dark"

def kit(slug, paper=None):
    """(paper rgb, 'light' | 'dark') of a style, from the registry or from --paper"""
    with open(os.path.join(ROOT, "styles", "registry.json")) as fh: reg = {k["slug"]: k for k in json.load(fh)}
    if slug in reg: return hex_rgb(reg[slug]["paper"]), reg[slug]["luma"]
    if paper: return hex_rgb(paper), luma_of(hex_rgb(paper))
    sys.exit(f"style {slug!r} is not in styles/registry.json: give --paper #hex")

# ---- picture helpers
def count(mask):
    return mask.histogram()[255]

def content_mask(im, paper, min_ratio=CONTENT):
    """white where a pixel stands out from the paper (lighter or darker), black elsewhere"""
    lp = lum(paper)
    grey = im.convert("RGB").point([round(v * 255) for v in LIN] * 3).convert("L", (0.2126, 0.7152, 0.0722, 0))
    return grey.point([255 if ratio(v / 255, lp) >= min_ratio else 0 for v in range(256)])

def safe_zone(fmt, k=1.0):
    """(x0, y0, x1, y1): the scene box plus the caption lines under it, scaled by k"""
    f = FORMATS[fmt]
    return (int((f["bx"] - MARGIN) * k), int((f["by"] - MARGIN) * k), int((f["bx"] + f["bw"] + MARGIN) * k), int((f["capY"] + 1.6 * f["capSize"] + MARGIN) * k))

def outside(mask, fmt, k=1.0):
    """the content mask with the safe zone and the progress bar blanked: what is left is outside"""
    m = mask.copy(); W, H = m.size
    m.paste(0, safe_zone(fmt, k)); m.paste(0, (0, int((FORMATS[fmt]["H"] - 12) * k), W, H))
    return m

def sides(mask, fmt, k=1.0):
    """content pixels of an `outside` mask, per side of the safe zone"""
    W, H = mask.size; x0, y0, x1, y1 = safe_zone(fmt, k)
    boxes = {"top": (0, 0, W, y0), "bottom": (0, y1, W, H), "left": (0, y0, x0, y1), "right": (x1, y0, W, y1)}
    return {s: n for s, b in boxes.items() if (n := count(mask.crop(b)))}

def caption_band(im, fmt):
    f = FORMATS[fmt]
    return im.crop((f["bx"], int(f["capY"] - 1.5 * f["capSize"]), f["bx"] + f["bw"], int(f["capY"] + 1.5 * f["capSize"])))

def caption_contrast(band, luma):
    """Contrast between the caption text and the pixels right around it (its outline, plate or the paper).
    The text is the dark tone on light paper and the light tone on dark paper. An empty band gives about 1."""
    raw = band.convert("RGB").tobytes(); L = [lum(raw[i:i + 3]) for i in range(0, len(raw), 3)]; s = sorted(L); n = len(s)
    text, mid = (s[n // 200] if luma == "light" else s[-1 - n // 200]), s[n // 2]
    cut = (text + mid) / 2
    mask = Image.new("L", band.size); mask.putdata([255 if (l < cut) == (text < mid) and l != cut else 0 for l in L])
    near, far = mask.filter(ImageFilter.MaxFilter(5)).tobytes(), mask.filter(ImageFilter.MaxFilter(17)).tobytes()
    ring = sorted(l for l, a, b in zip(L, near, far) if b and not a)  # 2 to 8 px away from the text
    return ratio(text, ring[len(ring) // 2]) if ring else 1.0

def cape_px(im):
    """pixels within 20 of the cape red on every channel: survives video compression, and leaves out a kit's own warning red"""
    r, g, b = ImageChops.difference(im.convert("RGB"), Image.new("RGB", im.size, CAPE)).split()
    return count(ImageChops.lighter(ImageChops.lighter(r, g), b).point(lambda v: 255 if v < 20 else 0))

def box_px(im, paper, fmt, k=1.0):
    """content pixels inside the scene box"""
    f = FORMATS[fmt]
    return count(content_mask(im.crop((int(f["bx"] * k), int(f["by"] * k), int((f["bx"] + f["bw"]) * k), int((f["by"] + f["bh"]) * k))), paper))

# ---- ffmpeg
def run(cmd):
    return subprocess.run(cmd, capture_output=True)

def probe(path):
    j = json.loads(run(["ffprobe", "-v", "error", "-show_entries", "format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,channels", "-of", "json", path]).stdout)
    v = next(s for s in j["streams"] if s["codec_type"] == "video"); a = next((s for s in j["streams"] if s["codec_type"] == "audio"), None)
    n, d = v["r_frame_rate"].split("/")
    return {"w": v["width"], "h": v["height"], "fps": int(n) / int(d), "vcodec": v["codec_name"], "acodec": a and a["codec_name"],
            "dur": float(j["format"]["duration"]), "mb": int(j["format"]["size"]) / 1e6}

def peak_db(path):
    m = re.search(r"max_volume: (-?[\d.]+) dB", run(["ffmpeg", "-v", "info", "-i", path, "-af", "volumedetect", "-vn", "-f", "null", "-"]).stderr.decode())
    return float(m.group(1)) if m else None

def still(path, t, size=None):
    """the frame at t seconds, full size or scaled by ffmpeg to size (w, h), as frames() does"""
    vf = ["-vf", f"scale={size[0]}:{size[1]}"] if size else []
    return Image.open(io.BytesIO(run(["ffmpeg", "-v", "error", "-ss", f"{t:.2f}", "-i", path, *vf, "-frames:v", "1", "-f", "image2pipe", "-c:v", "png", "-"]).stdout)).convert("RGB")

def frames(path, w, h, fps=2):
    """(t, image) for every 1/fps seconds, scaled to w x h, in one pass over the file"""
    # select keeps exact frames (0, 15, 30...); the fps filter would hand back frames about 0.23 s late
    vf = f"select='not(mod(n\\,{round(30 / fps)}))',scale={w}:{h}"
    with subprocess.Popen(["ffmpeg", "-v", "error", "-i", path, "-vf", vf, "-fps_mode", "passthrough", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE) as p:
        i = 0
        while len(buf := p.stdout.read(w * h * 3)) == w * h * 3:
            yield i / fps, Image.frombytes("RGB", (w, h), buf); i += 1

# ---- the checks
def verify(page, path, style, paper=None, max_s=None):
    """returns [(check name, passed, detail)]"""
    fmt = page.get("format", "short"); f = FORMATS[fmt]; doc = fmt == "doc"; out = []
    add = lambda name, ok, detail: out.append((name, bool(ok), detail))
    info = probe(path)
    add("size", (info["w"], info["h"]) == (f["W"], f["H"]), f"{info['w']}x{info['h']}, need {f['W']}x{f['H']}")
    add("video", abs(info["fps"] - 30) < 0.01 and info["vcodec"] == "h264", f"{info['vcodec']} at {info['fps']:g} fps, need h264 at 30")
    add("audio", info["acodec"], f"{info['acodec'] or 'no audio stream'}")
    if info["acodec"]:
        pk = peak_db(path); add("audio peak", pk is not None and -30 < pk < -0.5, f"{pk} dB, need -30 to -0.5 (lower is a silent track)")
    add("file size", info["mb"] < (500 if doc else 100), f"{info['mb']:.1f} MB")
    add("duration", abs(info["dur"] - page["dur"]) <= 0.5, f"{info['dur']:.2f} s, page.json says {page['dur']} s")
    if max_s is None and not doc: max_s = 60
    if max_s: add("length", info["dur"] <= max_s + 2, f"{info['dur']:.2f} s, at most {max_s} s")

    # which style draws each stretch of time: the accent kit on its beats, the primary kit elsewhere and on the end card
    prim = kit(style["primary"], paper); acc = kit(style["accent"], paper) if style.get("accent") else prim
    spans = [(b["a"], b["b"], acc if b.get("accent") else prim) for b in page["beats"]] + [(page["endAt"], 1e9, prim)]
    def at(t):  # (kit, True when another kit takes over within 0.5 s: skipped, the two are blending)
        i = max(j for j, s in enumerate(spans) if s[0] <= t or j == 0)
        return spans[i][2], i + 1 < len(spans) and spans[i + 1][2] != spans[i][2] and t > spans[i][1] - 0.5

    # captions, at full size: two samples per beat (one may land on a fade-in), the better one counts
    worst = None
    for i, b in enumerate(page["beats"]):
        t = b["start"] + (b["end"] - b["start"]) * 0.4
        c = max(caption_contrast(caption_band(still(path, u), fmt), at(u)[0][1]) for u in (t, t + 0.25))
        if worst is None or c < worst[0]: worst = (c, i + 1, t)
    if worst: add("caption contrast", worst[0] >= MIN_CAPTION, f"lowest {worst[0]:.1f}:1 in beat {worst[1]} near {worst[2]:.1f} s, need {MIN_CAPTION}:1")

    # one pass at half size for the end card, the opening and the safe zone
    k = 0.5; seen = []; last = None; opening = {}
    for t, im in frames(path, int(f["W"] * k), int(f["H"] * k)):
        (pp, _), blend = at(t); last = im
        if t in (0, 1.5, 3): opening[t] = content_mask(im, pp), box_px(im, pp, fmt, k)
        if not blend: seen.append((t, pp, outside(content_mask(im, pp), fmt, k).convert("1")))
    for b in page["beats"]:  # and the last 0.1 s of every beat, where a wipe or slide is at its widest
        t = b["b"] - 0.1; (pp, _), blend = at(t)
        if not blend: seen.append((t, pp, outside(content_mask(still(path, t, last.size), pp), fmt, k).convert("1")))  # ffmpeg scales it, as in the pass above, so fixed decoration matches
    share = count(content_mask(last, prim[0])) / (last.width * last.height)
    add("paper", share < 0.5, f"{share:.0%} of the last frame stands out from the {style['primary']} paper (a wrong --style or registry colour gives nearly 100%)")
    n, cape = box_px(last, prim[0], fmt, k), cape_px(last)
    add("end card", n >= 1500 and cape >= 200, f"last frame: {n} content px in the box (need 1500), {cape} cape-red px (need 200)")
    if not doc and len(opening) == 3:
        n0 = opening[0][1]
        moved = max(count(ImageChops.difference(opening[a][0], opening[b][0])) for a, b in ((0, 1.5), (1.5, 3)))
        add("opening", n0 >= 1500 and moved >= 600, f"frame 0 has {n0} content px in the box (need 1500); {moved} px change in the first 3 s (need 600)")
    bad = []
    for pp in {s[1] for s in seen}:  # per paper: whatever is outside in every frame is the kit's own decoration
        mine = [s for s in seen if s[1] == pp]; decor = mine[0][2]
        for s in mine[1:]: decor = ImageChops.logical_and(decor, s[2])
        near = decor.convert("L").filter(ImageFilter.MaxFilter(25))  # a counter inside a title block changes; still decoration
        for t, _, m in mine:
            hits = sides(ImageChops.subtract(m.convert("L"), near), fmt, k)
            if sum(hits.values()) >= MIN_PX: bad.append((t, hits))
    bad.sort()
    add("safe zone", not bad, f"{len(bad)} of {len(seen)} frames have content outside" + "".join(f"\n      {t:.1f} s: {h}" for t, h in bad[:6]))
    return out

def main():
    ap = argparse.ArgumentParser(description="Check one rendered pipeline2 video.")
    ap.add_argument("page"); ap.add_argument("video")
    ap.add_argument("--style"); ap.add_argument("--accent"); ap.add_argument("--paper"); ap.add_argument("--max", type=float)
    a = ap.parse_args()
    for p in (a.page, a.video):
        if not os.path.isfile(p): sys.exit(f"not found: {p}")
    with open(a.page) as fh: page = json.load(fh)
    style = dict(page.get("style") or {})
    if a.style: style["primary"] = a.style
    if a.accent: style["accent"] = a.accent
    if style.get("accent") == "none": del style["accent"]
    res = verify(page, a.video, style, a.paper, a.max)
    for name, ok, detail in res: print(f"  {'ok  ' if ok else 'FAIL'} {name}: {detail}")
    fails = [r for r in res if not r[1]]
    print(f"{os.path.basename(a.video)} ({style['primary']}): {'OK' if not fails else 'CHECK: ' + ', '.join(r[0] for r in fails)}")
    sys.exit(1 if fails else 0)

if __name__ == "__main__":
    main()
