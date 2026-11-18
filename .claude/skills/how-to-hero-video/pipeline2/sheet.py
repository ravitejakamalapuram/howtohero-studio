#!/usr/bin/env python3
"""Makes a contact sheet of one rendered video: the frame at 0.5 s, one frame per beat, and the end card.

  python3 sheet.py <page.json> <video.mp4> [sheet.png]     (default: <video>.sheet.png next to the video)

Each beat is shown 0.6 s before it ends, when its drawing is complete. Cells run left to right, top to bottom.
"""
import json, math, os, subprocess, sys, tempfile

def times(page):
    """[(label, seconds)] for the cells of the sheet"""
    beats = [(f"beat {i + 1}", max(b["a"], b["b"] - 0.6)) for i, b in enumerate(page["beats"])]
    return [("0.5 s", 0.5)] + beats + [("end card", page["dur"] - 0.3)]

def main(page_file, video, out=None):
    with open(page_file) as fh: page = json.load(fh)
    doc = page.get("format") == "doc"; cols, w = (4, 480) if doc else (6, 270)
    cells = times(page); cols = min(cols, len(cells)); out = out or os.path.splitext(video)[0] + ".sheet.png"
    with tempfile.TemporaryDirectory() as tmp:
        for i, (_, t) in enumerate(cells):
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", video, "-frames:v", "1", "-vf", f"scale={w}:-2", os.path.join(tmp, f"{i:03d}.png")], check=True)
        grid = f"tile={cols}x{math.ceil(len(cells) / cols)}:padding=8:margin=8:color=white"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(tmp, "%03d.png"), "-vf", grid, "-frames:v", "1", out], check=True)
    print(out); print("  " + " | ".join(f"{n} ({t:.1f} s)" for n, t in cells))

if __name__ == "__main__":
    if len(sys.argv) < 3: sys.exit(__doc__)
    main(*sys.argv[1:4])
