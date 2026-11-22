#!/usr/bin/env python3
"""Fetch the real photos a news Short asks for. Public-domain and CC0 only, from Openverse.

    python3 photos.py videos/<id>.json [--flow ../flow.json]

Run after the scenes are written and before build.mjs. Every scene item { "k": "photo", "src": "hubble-1",
"q": "Hubble Space Telescope", ... } is looked up on Openverse (api.openverse.org, no key) with license
cc0 or pdm only, so no credit is required and the photo is safe for monetised videos. The file is saved as
videos/<id>.photos/<src>.jpg and its source goes in videos/<id>.photos/credits.json (title, creator, licence,
page URL) for the Inbox card and the description. A photo that cannot be found, is too small, looks AI-made
or fails to download is left out: the item then draws nothing and the beat keeps its drawn items, so a
build never fails because of a photo. Exit code is always 0 unless the arguments are wrong.

Settings are flow.json "photos". Photos are for news Shorts only (the build step decides which videos get
photo items; this script does not look at the video's kind).
"""
import json, os, re, sys, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
API = "https://api.openverse.org/v1/images/"
UA = "howtohero-studio-photos/1.0"
AI_WORDS = re.compile(r"\b(ai|a\.i\.|artificial intelligence|generated|midjourney|dall[- ]?e|stable ?diffusion|diffusion|gpt|firefly|neural|synthetic)\b", re.I)


def get(url, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    return urllib.request.urlopen(req, timeout=timeout).read()


def looks_ai(r):
    text = " ".join([r.get("title") or "", r.get("source") or "", r.get("provider") or ""] + [t.get("name", "") for t in r.get("tags") or []])
    return bool(AI_WORDS.search(text))


def jpeg_size(b):
    """(width, height) read from a JPEG's header, or None. Openverse reports the ORIGINAL size, but the url is often a smaller copy, so the real size is read from the file."""
    i = 2
    while i + 9 < len(b):
        if b[i] != 0xFF:
            i += 1; continue
        m = b[i + 1]
        if m in (0xD8, 0x01) or 0xD0 <= m <= 0xD7:
            i += 2; continue
        n = int.from_bytes(b[i + 2:i + 4], "big")
        if 0xC0 <= m <= 0xCF and m not in (0xC4, 0xC8, 0xCC):
            return int.from_bytes(b[i + 7:i + 9], "big"), int.from_bytes(b[i + 5:i + 7], "big")
        i += 2 + n
    return None


def relevant(r, q):
    """The photo's own title must name the subject: at least half of the query's longer words. Keeps a pretty but wrong photo out."""
    words = {w for w in re.findall(r"[a-z0-9]+", q.lower()) if len(w) >= 4}
    if not words:
        return True
    text = (r.get("title") or "").lower()  # tags are the uploader's and often stuffed with popular words, so only the title counts
    return sum(w in text for w in words) * 2 >= len(words)


def candidates(results, cfg, q=""):
    """Acceptable results in order: trusted source first, then the biggest."""
    ok = []
    for r in results:
        w, h = r.get("width") or 0, r.get("height") or 0
        if r.get("license") not in ("cc0", "pdm") or min(w, h) < cfg["minShortSide"] or max(w, h) < cfg["minLongSide"] or looks_ai(r) or not relevant(r, q):
            continue
        trust = any(s in (r.get("source") or "").lower() or s in (r.get("provider") or "").lower() or s in (r.get("foreign_landing_url") or "").lower() for s in cfg["trustedSources"])
        ok.append((0 if trust else 1, -(w * h), r))
    ok.sort(key=lambda x: x[:2])
    return [r for _, _, r in ok]


def fetch(item, out, cfg):
    q = item.get("q")
    if not q:
        return None, "item has no \"q\" search words"
    params = {"q": q, "license": "cc0,pdm", "category": "photograph", "page_size": "20", "mature": "false"}
    data = json.loads(get(API + "?" + urllib.parse.urlencode(params)))
    cands, why = candidates(data.get("results", []), cfg, q), []
    if not cands:
        return None, f"no acceptable photo for \"{q}\" ({data.get('result_count', 0)} found; need cc0/pdm, not AI, named in its title, listed size at least {cfg['minLongSide']} x {cfg['minShortSide']})"
    for r in cands[:6]:
        try:
            img = get(r["url"], 60)
        except Exception as e:
            why.append(f"{r.get('source')}: {type(e).__name__}"); continue
        if img[:3] != b"\xff\xd8\xff":  # JPEG only: the engine loads <src>.jpg
            why.append(f"{r.get('source')}: not a JPEG"); continue
        wh = jpeg_size(img)
        if not wh or max(wh) < cfg["minLongSide"] or min(wh) < cfg["minShortSide"]:
            why.append(f"{r.get('source')}: downloaded copy is {wh and 'x'.join(map(str, wh))} px, too small"); continue
        with open(os.path.join(out, item["src"] + ".jpg"), "wb") as f:
            f.write(img)
        return {"src": item["src"], "title": r.get("title"), "creator": r.get("creator"), "license": r.get("license"), "source": r.get("source"),
                "page": r.get("foreign_landing_url"), "url": r["url"], "width": wh[0], "height": wh[1]}, None
    return None, "tried " + str(min(6, len(cands))) + ": " + "; ".join(why)


def main():
    args = sys.argv[1:]
    if not args or args[0].startswith("-"):
        sys.exit(__doc__)
    vf = os.path.abspath(args[0])
    flow = os.path.abspath(args[args.index("--flow") + 1]) if "--flow" in args else os.path.join(HERE, "..", "flow.json")
    cfg = json.load(open(flow)).get("photos", {"enabled": False})
    sf = vf[:-5] + ".scenes.json"
    if not cfg.get("enabled") or not os.path.exists(sf):
        print("photos off: drawn art only"); return
    items = [it for b in json.load(open(sf)).get("beats", []) for it in b.get("items", []) if it.get("k") == "photo"]
    if not items:
        print("no photo items in this video"); return
    items = items[: cfg["maxPerVideo"]]
    out = vf[:-5] + ".photos"
    os.makedirs(out, exist_ok=True)
    got, skipped = [], []
    for it in items:
        try:
            c, why = fetch(it, out, cfg)
        except Exception as e:  # network blocked, API down, bad image: the beat keeps its drawn items
            c, why = None, f"{type(e).__name__}: {str(e)[:120]}"
        if c:
            got.append(c)
        else:
            skipped.append({"src": it["src"], "why": why})
    json.dump({"photos": got, "skipped": skipped}, open(os.path.join(out, "credits.json"), "w"), indent=2)
    for c in got:
        print(f"photo {c['src']}: {c['title']!r} by {c['creator'] or 'unknown'} ({c['license']}, {c['source']}) {c['page']}")
    for s in skipped:
        print(f"photo {s['src']}: left out, {s['why']}")
    if len(items) < len([1 for b in json.load(open(sf)).get("beats", []) for i in b.get("items", []) if i.get("k") == "photo"]):
        print(f"more than {cfg['maxPerVideo']} photo items: the rest were not fetched and draw nothing")


if __name__ == "__main__":
    main()
