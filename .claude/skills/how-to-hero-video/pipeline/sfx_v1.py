#!/usr/bin/env python3
"""Sound pass for the v1 pipeline: add earshot sound effects to a rendered video, leaving the picture untouched.

    python3 sfx_v1.py work/<id>/timing.json <rendered.mp4> [--out <other.mp4>] [--flow ../flow.json]

Run after `hyperframes render` and before verify.py. Without --out it replaces the rendered file. It keeps the video stream as it is (-c:v copy), keeps the voice and
the v1 music bed already in the file, and adds a soft whoosh just before each cut, a bell on the end card and a quiet
ambience bed matched to the topic, then normalises to -14 LUFS. Settings are flow.json "sound", the same as pipeline2.
Without earshot, or with sound.enabled false, the file is left as it is and the script exits 0.
"""
import importlib.util, json, os, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("sfx2", os.path.join(HERE, "..", "pipeline2", "sfx.py"))
sfx2 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sfx2)


def main():
    a = sys.argv[1:]
    if len(a) < 2 or a[0].startswith("-"):
        sys.exit(__doc__)
    timing, src = os.path.abspath(a[0]), os.path.abspath(a[1])
    opt = lambda n, d=None: a[a.index(n) + 1] if n in a else d
    out = os.path.abspath(opt("--out", src))
    tmp = out[:-4] + ".sfx-tmp.mp4"
    flow = os.path.abspath(opt("--flow", os.path.join(HERE, "..", "flow.json")))
    cfg = json.load(open(flow)).get("sound", {"enabled": False})
    if not cfg.get("enabled"):
        return print("sound pass off: file left as it is")
    if not shutil.which("earshot"):
        return print('earshot not installed (pip install "earshot @ git+https://github.com/Leonxlnx/earshot"): file left as it is')
    t = json.load(open(timing))
    dur, v = t["end"], cfg["volume"]
    cache = os.path.join(HERE, "work", "sfx")
    try:
        cues = [(sfx2.sound(cfg["cut"], cache), max(0, b["a"] - 0.0), v["cut"]) for b in t["beats"][1:]]  # beat a is already 0.15 s before the line starts
        cues.append((sfx2.sound(cfg["end"], cache), t["beats"][-1]["a"] + 0.3, v["end"]))
        topic = t.get("topic", "")
        bed = sfx2.sound(sfx2.bed_for(topic, cfg), cache)
    except subprocess.CalledProcessError as err:
        return print("earshot failed (" + sfx2.last_line(err) + "): file left as it is")
    ins = ["-i", src, "-stream_loop", "-1", "-i", bed]
    fc = [f"[1]atrim=0:{dur},volume={v['bed']},afade=t=in:d=2,afade=t=out:st={max(0, dur - 2.5):.2f}:d=2.5[bed]"]
    lab = ["[0:a]", "[bed]"]
    for i, (f, s, vol) in enumerate(cues, start=2):
        ins += ["-i", f]
        fc.append(f"[{i}]adelay={int(s * 1000)}:all=1,volume={vol}[s{i}]")
        lab.append(f"[s{i}]")
    fc.append("".join(lab) + f"amix=inputs={len(lab)}:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5,aresample=48000[a]")
    try:
        sfx2.run(["ffmpeg", "-y", "-v", "error", *ins, "-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", tmp])
        os.replace(tmp, out)
    except subprocess.CalledProcessError as err:
        return print("mix failed (" + sfx2.last_line(err) + "): file left as it is")
    print(f"sound pass: {len(cues)} effects + bed -> {out}")


if __name__ == "__main__":
    main()
