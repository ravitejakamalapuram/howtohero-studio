#!/usr/bin/env python3
"""Weekly report and tuning proposal for one channel (its flow.json), sent as one Inbox card.

1. Applies last week's proposal if the user approved it (writes flow.json; the learn workflow commits it).
2. Scores every posted video at the same age: its day-7 views per platform (data.metrics, stored daily by stats.py)
   divided by that platform's median over the last 28 days, as a log, averaged over its platforms.
3. For each lever (style, hookPattern, kind, length under/over 45 s) it averages the scores per value and shrinks
   them toward 0 by n/(n+8). A value needs MIN_N videos (15 for length) before it counts, and a shrunk difference
   under 20% is ignored as noise.
4. Proposes style weights only (the one lever flow.json holds), at most 10% up or down a week; the floor in
   flow.json keeps every style in play. Hook, kind and length results are reported for the scout and build to use.
Nothing changes without the user's tap. Run with --dry-run to print the card only.
Needs INBOX_URL and INBOX_TOKEN (SOCIAL_URL and SOCIAL_TOKEN are read by the shared helpers).
"""
import datetime as dt
import json
import math
import os
import re
import statistics
import sys

from publish import inbox, social

FLOW = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.claude', 'skills', 'how-to-hero-video', 'flow.json')
MIN_N = 8        # videos a value needs before it counts (length needs 15)
NOISE = 0.2      # shrunk differences smaller than 20% are ignored
MAX_STEP = 0.1   # a weight moves at most 10% a week
DRY = '--dry-run' in sys.argv


def apply_approved(flow):
    """Writes the weights of approved proposals into flow.json, then closes them. Returns True if flow.json changed."""
    changed = False
    for item in inbox({'action': 'list', 'type': 'flow-tune', 'status': 'approved', 'limit': 50})['items']:
        weights = (item.get('data') or {}).get('weights') or {}
        for slug, w in weights.items():
            if slug in flow['style']['kits']:
                flow['style']['kits'][slug]['weight'] = w
                changed = True
        if not DRY:
            inbox({'action': 'update', 'id': item['id'], 'ifVersion': item['version'], 'set': {'status': 'done', 'note': 'applied to flow.json'}})
    return changed


def scored(flow):
    """[(video data, score)] for the channel's posted videos that have day-7 views."""
    items = [i for i in inbox({'action': 'list', 'type': 'video', 'status': 'posted', 'limit': 1000})['items']
             if (i.get('data') or {}).get('channel', 'how-to-hero') == flow['channel']]
    now = dt.datetime.now(dt.timezone.utc)
    recent = lambda d: d.get('postedAt') and now - dt.datetime.fromisoformat(d['postedAt'].replace('Z', '+00:00')) < dt.timedelta(days=35)
    base = {}  # platform -> median day-7 views of the videos posted in the last 28 (+7) days
    for i in items:
        d = i.get('data') or {}
        for p, m in (d.get('metrics') or {}).items():
            if recent(d) and m.get('d7') is not None:
                base.setdefault(p, []).append(m['d7'])
    base = {p: max(1, statistics.median(v)) for p, v in base.items()}
    out = []
    for i in items:
        d = i.get('data') or {}
        s = [math.log((m['d7'] + 1) / base[p]) for p, m in (d.get('metrics') or {}).items() if m.get('d7') is not None and p in base]
        if s:
            out.append((d, sum(s) / len(s), i))
    return out, base


def length_bucket(d):
    m = re.search(r'\|\s*([\d.]+) s\s*\|', d.get('videoRef') or '')
    return None if not m else ('under 45 s' if float(m.group(1)) < 45 else '45 s or more')


LEVERS = {'style': lambda d: d.get('style') or 'classic', 'hookPattern': lambda d: d.get('hookPattern'),
          'kind': lambda d: d.get('kind'), 'length': length_bucket}


def lever_table(rows):
    """{lever: {value: (n, shrunk mean score)}}"""
    t = {}
    for lever, get in LEVERS.items():
        groups = {}
        for d, sc, _ in rows:
            v = get(d)
            if v:
                groups.setdefault(v, []).append(sc)
        need = 15 if lever == 'length' else MIN_N
        t[lever] = {v: (len(x), (sum(x) / len(x)) * len(x) / (len(x) + 8)) for v, x in groups.items() if len(x) >= need}
    return t


def proposal(flow, t):
    new = {}
    for slug, (n, sc) in t['style'].items():
        if slug in flow['style']['kits'] and abs(math.exp(sc) - 1) >= NOISE:
            w = flow['style']['kits'][slug]['weight']
            new[slug] = round(w * min(1 + MAX_STEP, max(1 - MAX_STEP, math.exp(sc))), 2)
    return new


def monetisation():
    """One line on the YouTube Partner Programme thresholds for Shorts: 500 subscribers and 3M Shorts views in 90 days
    for the lower tier (fan funding), 1,000 and 10M for ad revenue. Channel views are lifetime, so they match the
    90-day window only while the channel is under 90 days old."""
    try:
        y = social({'action': 'stats', 'platform': 'youtube', 'limit': 1})
    except Exception as e:  # the rest of the report still goes out
        return f'YouTube monetisation: numbers not available ({e}).'
    subs, views = y.get('followers'), y.get('channelViews')
    if subs is None or views is None:
        return 'YouTube monetisation: subscriber or view count hidden.'
    return (f'YouTube monetisation: {subs:,} subscribers (500 for the lower tier, 1,000 for ads), '
            f'{views:,} channel views (3M Shorts views in 90 days for the lower tier, 10M for ads).')


def main():
    flow = json.load(open(FLOW))
    if apply_approved(flow) and not DRY:
        open(FLOW, 'w').write(json.dumps(flow, indent=2, ensure_ascii=False) + '\n')
        print('applied approved weights to flow.json')
    rows, base = scored(flow)
    week = dt.date.today().isocalendar()
    t = lever_table(rows)
    pct = lambda sc: f"{(math.exp(sc) - 1) * 100:+.0f}%"
    lines = [f"{flow['channel']}, week {week[1]}: {len(rows)} posted videos with day-7 views.",
             'Typical day-7 views: ' + (', '.join(f'{p} {v:.0f}' for p, v in sorted(base.items())) or 'none yet') + '.']
    for lever, vals in t.items():
        if vals:
            ranked = sorted(vals.items(), key=lambda kv: -kv[1][1])
            lines.append(f'{lever}: ' + ', '.join(f'{v} {pct(sc)} ({n})' for v, (n, sc) in ranked))
        else:
            lines.append(f"{lever}: not enough data yet ({15 if lever == 'length' else MIN_N} videos per value)")
    lines.append(monetisation())
    new = {s: w for s, w in proposal(flow, t).items() if w != flow['style']['kits'][s]['weight']}
    if new:
        lines.append('Proposed style weights: ' + ', '.join(f"{s} {flow['style']['kits'][s]['weight']} -> {w}" for s, w in new.items()) +
                     '. Approve to apply them; reject to keep the weights.')
    else:
        lines.append('No weight change proposed this week. Approve or reject just closes this card.')
    summary = '\n'.join(lines)
    print(summary)
    if not DRY and rows:
        inbox({'action': 'add', 'id': f"learn-{flow['channel']}-{week[0]}-w{week[1]:02d}", 'type': 'flow-tune', 'status': 'pending',
               'title': f"Weekly report: what worked on {flow['channel']}", 'summary': summary,
               'data': {'app': 'How To Hero', 'icon': '📈', 'weights': new, 'channel': flow['channel']}})
    return 0


if __name__ == '__main__':
    sys.exit(main())
