#!/usr/bin/env python3
"""Dry run of the series publishing engine (publisher/lanes.py, publisher/series.json): prints what each platform of
each series would post at this run, next to what publish.py really does. It only reads the Inbox and never posts.

Needs INBOX_URL and INBOX_TOKEN. --at <ISO time> plans for another moment (for checking a schedule by hand).
"""
import datetime as dt
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lanes
import publish


def main():
    now = dt.datetime.now(dt.timezone.utc)
    if '--at' in sys.argv:
        now = lanes.parse(sys.argv[sys.argv.index('--at') + 1])
    cfg = lanes.load()
    items = publish.inbox({'action': 'list', 'status': 'approved,posted', 'type': 'video', 'limit': 1000})['items']
    try:
        channels = publish.inbox({'action': 'channelConfig'}).get('channels', {})
    except RuntimeError as e:
        print(f'no channelConfig ({e}); post_to series plan nothing')
        channels = {}
    post_to = {app: c.get('postTo') or {} for app, c in channels.items()}
    if not post_to.get(publish.DEFAULT_APP):  # as publish.py: the default channel falls back to PLATFORMS
        post_to[publish.DEFAULT_APP] = {p.strip(): '' for p in os.environ.get('PLATFORMS', 'instagram,facebook,youtube').split(',') if p.strip()}
    due = lanes.due_slots(cfg, now)
    lines = [f"Series engine dry run at {now.astimezone(lanes.IST):%a %d %b %H:%M} IST; due slots: {', '.join(due) or 'none'}"]
    for r in lanes.plan(cfg, items, now, post_to, publish.DEFAULT_APP):
        who = f"{r['series']} / {r['platform']}" + (f":{r['account']}" if r['account'] else '')
        lines.append(f"- {who}: " + (f"would post {r['id']} ({r['title']}), {r['why']}" if r['id'] else f"waits, {r['why']}"))
    print('\n'.join(lines))
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as fh:
            fh.write('\n'.join(lines) + '\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())
