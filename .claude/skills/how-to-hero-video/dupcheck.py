#!/usr/bin/env python3
"""Finds Inbox items that already cover a topic, so a job never makes the same video twice.

  dupcheck.py "<topic or slug>" [--skip <item id>]  -> DUPLICATE lines (exit 1 if any) and up to 5 CHECK lines;
                                                       exit 2 means the check could not run: treat it as a failed Inbox call
  dupcheck.py --audit                               -> pairs of items that cover the same topic

DUPLICATE means the words of the subject mostly match (id, title or data.topic of an item).
CHECK means the subjects overlap: read those and decide whether the angle is really new.
Words are compared, not meaning, so paraphrases ("phones home" vs "talks to Earth") show up as CHECK.
CHECK also lists items that share a rare word (one used by at most RARE items, usually a name such as
"voyager" or "hayabusa2"), because two videos about the same named thing are the likeliest repeats.

It compares against EVERY Inbox item (all types, all statuses, all sources: ideas, stories,
pending, approved, posted and rejected videos), fetched with inbox.sh next to this file.
--items <file.json> reads a saved `list` reply instead of calling the Inbox (for tests).
Only the standard library; needs INBOX_URL and INBOX_TOKEN unless --items is given.
"""
import argparse, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
# Words that say nothing about the subject.
STOP = set("""a an the of to in on at by for and or with from into its it is are was were be been
how why what when where who which will would could can may might does did do really still actually
work works working made make makes get gets got this that these those our your we you new first
one two out up down over about after before inside behind under than then just ever never only
shorts science space tech news explainer video""".split())


def words(text):
    out = set()
    for w in re.findall(r"[a-z0-9]+", (text or "").lower().replace("'", "")):
        if w in STOP or len(w) < 3 or w.isdigit():
            continue
        if len(w) > 4 and w.endswith("ies"):
            w = w[:-3] + "y"
        elif len(w) > 3 and w.endswith("s") and not w.endswith("ss"):
            w = w[:-1]
        out.add(w)
    return out


def fields(it):
    """Word sets for the item's id, title and data.topic, each compared on its own."""
    d = it.get("data") or {}
    if isinstance(d, str):
        try:
            d = json.loads(d)
        except ValueError:
            d = {}
    texts = [it.get("id", "").replace("-", " "), it.get("title", ""), str(d.get("topic", ""))]
    return [w for w in map(words, texts) if w]


def score(a_sets, b_sets):
    """Best Jaccard overlap between any field of one and any field of the other (0..1)."""
    best = 0.0
    for a in a_sets:
        for b in b_sets:
            best = max(best, len(a & b) / len(a | b))
    return best


DUP, NEAR = 0.5, 0.2
RARE = 3  # a word in at most this many items counts as a name worth a CHECK


def fail(msg):
    print("dupcheck: " + msg, file=sys.stderr)
    sys.exit(2)  # 2 = could not check; 1 = duplicate found


def load(path):
    if path:
        reply = json.load(open(path))
    else:
        out = subprocess.run([os.path.join(HERE, "inbox.sh"), "call", '{"action":"list","limit":1000}'],
                             capture_output=True, text=True)
        if out.returncode != 0:
            fail("the Inbox list call failed")
        reply = json.loads(out.stdout)
    if reply.get("total", 0) > len(reply.get("items", [])):
        fail("the Inbox returned only part of the list")
    return reply["items"]


def main():
    p = argparse.ArgumentParser()
    p.add_argument("topic", nargs="?")
    p.add_argument("--skip", action="append", default=[], help="item id to ignore (the item itself)")
    p.add_argument("--audit", action="store_true")
    p.add_argument("--items")
    a = p.parse_args()
    items = [it for it in load(a.items) if it.get("id") not in a.skip]
    if a.audit:
        found = 0
        for i, x in enumerate(items):
            for y in items[i + 1:]:
                if score(fields(x), fields(y)) >= DUP:
                    found += 1
                    print(f"{x['id']} ({x.get('type')}, {x.get('status')})  ~  {y['id']} ({y.get('type')}, {y.get('status')})")
        sys.exit(1 if found else 0)
    if not a.topic:
        p.error("give a topic, or --audit")
    want = [words(a.topic)]
    df = {}
    for it in items:
        for w in set().union(*fields(it)):
            df[w] = df.get(w, 0) + 1
    rare = {w for w in want[0] if df.get(w, 0) <= RARE}

    def near(s, it):
        return s >= NEAR or bool(rare & set().union(*fields(it)))

    ranked = sorted(((score(want, fields(it)), it) for it in items), key=lambda p: -p[0])
    hits = [it for s, it in ranked if s >= DUP]
    for it in hits:
        print(f"DUPLICATE {it['id']} ({it.get('type')}, {it.get('status')}): {it.get('title', '')}")
    for s, it in [p for p in ranked if p[0] < DUP and near(*p)][:5]:
        print(f"CHECK {it['id']} ({it.get('type')}, {it.get('status')}): {it.get('title', '')}")
    sys.exit(1 if hits else 0)


if __name__ == "__main__":
    main()
