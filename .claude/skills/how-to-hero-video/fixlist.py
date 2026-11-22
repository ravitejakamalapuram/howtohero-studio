#!/usr/bin/env python3
"""Lists items the person rejected with a reason, that a job may now fix and send back for review.

  fixlist.py --max 3 [--types story,idea] [--channel anaadi | --not-channel anaadi] [--items file.json]

Prints one JSON object per line: {id, type, title, count, reason, reasons, data}, oldest first.
An item is listed when its status is rejected, data.rejections has an entry (the Inbox adds one on every
reject by the person; a job's own "rejected" notes have none), the entry count is at most --max, and
data.fixFailures is below 2. Items past those limits are counted on stderr ("left for you: N") and stay rejected.
--channel / --not-channel compare data.channel; --types compares the item type.
Needs INBOX_URL and INBOX_TOKEN unless --items (a saved `list` reply) is given.
"""
import argparse, json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))


def pick(items, max_fixes, types=None, channel=None, not_channel=None):
    out, left = [], 0
    for it in items:
        data = it.get("data") if isinstance(it.get("data"), dict) else {}
        rej = [r for r in (data.get("rejections") or []) if isinstance(r, dict) and r.get("reason")]
        if it.get("status") != "rejected" or not rej:
            continue
        if types and it.get("type") not in types:
            continue
        ch = data.get("channel") or ""
        if channel and ch != channel:
            continue
        if not_channel and ch == not_channel:
            continue
        if len(rej) > max_fixes or int(data.get("fixFailures") or 0) >= 2:
            left += 1
            continue
        out.append({"id": it["id"], "type": it.get("type"), "title": it.get("title"), "count": len(rej),
                    "reason": rej[-1]["reason"], "reasons": [r["reason"] for r in rej], "data": data,
                    "_at": it.get("updatedAt") or ""})
    out.sort(key=lambda o: o["_at"])
    for o in out:
        del o["_at"]
    return out, left


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--max", type=int, required=True)
    ap.add_argument("--types")
    ap.add_argument("--channel")
    ap.add_argument("--not-channel")
    ap.add_argument("--items")
    a = ap.parse_args()
    if a.items:
        reply = json.load(open(a.items))
    else:
        body = json.dumps({"action": "list", "status": "rejected", "limit": 1000})
        r = subprocess.run([os.path.join(HERE, "inbox.sh"), "call", body], capture_output=True, text=True)
        if r.returncode:
            print("fixlist: Inbox call failed", file=sys.stderr)
            sys.exit(2)
        reply = json.loads(r.stdout)
    out, left = pick(reply.get("items", []), a.max, set(a.types.split(",")) if a.types else None, a.channel, a.not_channel)
    for o in out:
        print(json.dumps(o, ensure_ascii=False))
    print(f"fixlist: {len(out)} to fix, left for you: {left}", file=sys.stderr)


if __name__ == "__main__":
    main()
