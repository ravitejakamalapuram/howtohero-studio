#!/usr/bin/env python3
"""Sound pass: lay free code-made sound effects and a quiet ambience bed under the voice.

    python3 sfx.py work/<id>/page.json [--flow ../flow.json]

Run after build.mjs and before render.cjs. It reads the voice track and beat times from page.json,
renders the sounds with earshot (github.com/Leonxlnx/earshot, MIT; what it renders is ours, no credit
needed), mixes them under the voice at -14 LUFS into work/<id>/mix.wav and points page.json's "audio"
at it, so render.cjs picks it up. The voice track is kept as "voice" so a rerun starts from it again.

Settings are flow.json "sound". With sound.enabled false, or when earshot is not installed, the page
is left on the plain voice track and the script exits 0: a missing sound pass never stops a build.
"""
import json, os, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def sound(words, cache):
    """Render one sound from a request in words, once per machine (earshot output is deterministic per request)."""
    os.makedirs(cache, exist_ok=True)
    f = os.path.join(cache, words.replace(" ", "_") + ".wav")
    if not os.path.exists(f):
        run(["earshot", "make", words, "-o", f])
    return f


def bed_for(topic, cfg):
    t = (topic or "").lower()
    for words, keys in cfg.get("bedByKeyword", {}).items():
        if any(k in t for k in keys):
            return words
    return cfg["bed"]


def main():
    args = sys.argv[1:]
    if not args or args[0].startswith("-"):
        sys.exit(__doc__)
    pf = os.path.abspath(args[0])
    flow = os.path.abspath(args[args.index("--flow") + 1]) if "--flow" in args else os.path.join(HERE, "..", "flow.json")
    page = json.load(open(pf))
    cfg = json.load(open(flow)).get("sound", {"enabled": False})
    voice = page.get("voice") or page.get("audio")
    if not cfg.get("enabled") or not voice:
        print("sound pass off: plain voice track"); return
    if not shutil.which("earshot"):
        print('earshot not installed (pip install "earshot @ git+https://github.com/Leonxlnx/earshot"): plain voice track')
        return
    cache = os.path.join(HERE, "work", "sfx")
    v, dur, beats = cfg["volume"], page["dur"], page["beats"]
    cues = []  # (file, second, volume)
    try:
        for b in beats[1:]:  # a whoosh just before each cut; nothing on the hook
            cues.append((sound(cfg["cut"], cache), max(0, b["start"] - 0.15), v["cut"]))
        hits = 0
        for b in beats:  # a hit on a beat's first warning label, at most 2 a video: more and they stop meaning anything
            warn = [it for it in b["items"] if it.get("role") == "warn"]
            if warn and b["start"] > 3 and hits < 2:
                cues.append((sound(cfg["hit"], cache), b["a"] + (warn[0].get("at") or 0), v["hit"]))
                hits += 1
        cues.append((sound(cfg["end"], cache), page["endAt"], v["end"]))
        bed = sound(bed_for(page.get("topic"), cfg), cache)
    except subprocess.CalledProcessError as err:
        print("earshot failed (" + err.stderr.decode(errors="replace").strip().splitlines()[-1][:200] + "): plain voice track")
        return
    ins = ["-i", voice, "-stream_loop", "-1", "-i", bed]
    fc = [f"[1]atrim=0:{dur},volume={v['bed']},afade=t=in:d=2,afade=t=out:st={max(0, dur - 2.5):.2f}:d=2.5[bed]"]
    lab = ["[0]", "[bed]"]
    for i, (f, t, vol) in enumerate(cues, start=2):
        ins += ["-i", f]
        fc.append(f"[{i}]adelay={int(t * 1000)}:all=1,volume={vol}[s{i}]")
        lab.append(f"[s{i}]")
    fc.append("".join(lab) + f"amix=inputs={len(lab)}:normalize=0,atrim=0:{dur},loudnorm=I=-14:TP=-1.5,aresample=48000[a]")
    out = os.path.join(os.path.dirname(pf), "mix.wav")
    run(["ffmpeg", "-y", "-v", "error", *ins, "-filter_complex", ";".join(fc), "-map", "[a]", out])
    page["voice"], page["audio"] = voice, out
    json.dump(page, open(pf, "w"))
    print(f"sound pass: {len(cues)} effects + bed '{bed_for(page.get('topic'), cfg)}' -> {out}")


if __name__ == "__main__":
    main()
