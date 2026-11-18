#!/usr/bin/env python3
"""Weekly style check: are some styles watched more than others? Proposes new style weights for approval.

1. Applies last week's proposal if the user approved it in the Inbox (writes flow.json; the workflow commits it).
2. Joins every posted How To Hero video (Inbox: data.style, data.voice, data.geo, data.posted.<platform>)
   with its views from Social Manager "stats" (Instagram and Facebook; YouTube needs the Analytics scope, not yet),
   by post link.
3. A style with at least MIN_PER_ARM videos gets weight = its median views / the median of all styled videos,
   kept between 0.5 and 2. Styles with fewer videos keep their weight. Nothing changes without the user's tap.
Run with --dry-run to print the table only. Needs INBOX_URL, INBOX_TOKEN, SOCIAL_URL and SOCIAL_TOKEN.
"""
import datetime as dt
import json
import os
import statistics
import sys

from publish import inbox, social

FLOW = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.claude', 'skills', 'how-to-hero-video', 'flow.json')
MIN_PER_ARM = 8
PLATFORMS = ['instagram', 'facebook']
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


def views_by_url():
    out = {}
    for p in PLATFORMS:
        try:
            for post in social({'action': 'stats', 'platform': p, 'limit': 100}).get('posts', []):
                if post.get('url') and post.get('views') is not None:
                    out[post['url']] = post['views']
        except Exception as e:  # one platform failing should not stop the report
            print(f'{p} stats failed: {e}')
    return out


def table(flow):
    views = views_by_url()
    arms = {}
    for item in inbox({'action': 'list', 'type': 'video', 'status': 'posted', 'limit': 1000})['items']:
        d = item.get('data') or {}
        if d.get('channel', 'how-to-hero') != flow['channel']:
            continue
        v = [views[u] for u in (d.get('posted') or {}).values() if u in views]
        if v:
            arms.setdefault(d.get('style') or 'classic', []).append(sum(v))
    return arms


def proposal(flow, arms):
    styled = [x for s, vs in arms.items() if s in flow['style']['kits'] for x in vs]
    if not styled:
        return {}
    base = statistics.median(styled) or 1
    return {s: round(min(2.0, max(0.5, statistics.median(vs) / base)), 2)
            for s, vs in arms.items() if s in flow['style']['kits'] and len(vs) >= MIN_PER_ARM}


def main():
    flow = json.load(open(FLOW))
    if apply_approved(flow) and not DRY:
        open(FLOW, 'w').write(json.dumps(flow, indent=2, ensure_ascii=False) + '\n')
        print('applied approved weights to flow.json')
    arms = table(flow)
    lines = [f"{s}: {len(vs)} videos, median {statistics.median(vs):.0f} views" for s, vs in sorted(arms.items())]
    print('\n'.join(lines) or 'no posted videos with views yet')
    new = {s: w for s, w in proposal(flow, arms).items() if w != flow['style']['kits'][s]['weight']}
    if not new:
        print(f'no change proposed (a style needs {MIN_PER_ARM} posted videos with views)')
        return 0
    week = dt.date.today().isocalendar()
    summary = ('Views per style (Instagram + Facebook):\n' + '\n'.join(lines) + '\n\nProposed weights: ' +
               ', '.join(f"{s} {flow['style']['kits'][s]['weight']} -> {w}" for s, w in new.items()) +
               '\nApprove to apply them to flow.json next week; reject to keep the weights.')
    print(summary)
    if not DRY:
        inbox({'action': 'add', 'id': f'flow-tune-{week[0]}-w{week[1]:02d}', 'type': 'flow-tune', 'status': 'pending',
               'title': 'Tune style weights from last week\'s views', 'summary': summary,
               'data': {'app': 'How To Hero', 'icon': '📈', 'weights': new}})
    return 0


if __name__ == '__main__':
    sys.exit(main())
