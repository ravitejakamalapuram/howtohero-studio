#!/usr/bin/env python3
"""Sends How To Hero's and each serialized channel's daily numbers to the Inbox Channels page.

For each platform in PLATFORMS it reads followers and the newest posts' likes, comments and views from
Social Manager (action "stats") and passes them to the Inbox (action "channelStats"). Running it twice on
one day replaces that day's numbers. Needs INBOX_URL, INBOX_TOKEN, SOCIAL_URL and SOCIAL_TOKEN.
"""
import datetime as dt
import os
import sys

from publish import RULES, SERIES, inbox, social

APP = 'How To Hero'  # the channel name on the Inbox Channels page
# The Inbox tokens that add How To Hero items. Those items carry no data.app, so the channel claims them by source.
SOURCES = ['queue', 'news']
# When the Inbox starts publish.yml (IST): every platform's postTimesIST in platforms/<name>.json, merged.
# One run posts one video to every platform, so the platforms share these times.
TIMES = sorted({t for r in RULES.values() for t in r.get('postTimesIST', [])})


def snapshot(views):
    """Stores each posted video's views at day 2 and day 7 in data.metrics.<platform>.{d2,d7}, once, so the weekly
    learn.py compares every video at the same age. views: {post url: (views, posted at)}."""
    now = dt.datetime.now(dt.timezone.utc)
    for item in inbox({'action': 'list', 'type': 'video', 'status': 'posted', 'limit': 1000})['items']:
        data = item.get('data') if isinstance(item.get('data'), dict) else {}
        metrics, changed = dict(data.get('metrics') or {}), False
        for platform, url in (data.get('posted') or {}).items():
            if url not in views:
                continue
            v, at = views[url]
            try:
                age = (now - dt.datetime.fromisoformat(str(at).replace('Z', '+00:00'))).days
            except ValueError:
                continue
            m = dict(metrics.get(platform) or {})
            for day in (2, 7):
                if age >= day and f'd{day}' not in m and v is not None:
                    m[f'd{day}'] = v
                    changed = True
            metrics[platform] = m
        if changed:
            inbox({'action': 'update', 'id': item['id'], 'ifVersion': item['version'], 'set': {'data': dict(data, metrics=metrics)}})


def main():
    failed, views = 0, {}
    for p in [x.strip() for x in os.environ.get('PLATFORMS', 'instagram,facebook').split(',') if x.strip()]:
        try:
            s = social({'action': 'stats', 'platform': p, 'limit': 50})
            views.update({x['url']: (x.get('views'), x.get('at')) for x in s.get('posts', []) if x.get('url')})
            body = {'action': 'channelStats', 'app': APP, 'platform': p, 'followers': s.get('followers'), 'posts': s.get('posts', []),
                    'sources': SOURCES}
            if os.environ.get('GITHUB_REPOSITORY'):  # lets the dashboard's "Post now" start publish.yml here,
                # and the Inbox's timer start it at the daily slots in TIMES (IST), since GitHub's schedule never fired
                body['publish'] = {'repo': os.environ['GITHUB_REPOSITORY'], 'workflow': 'publish.yml',
                                   'times': TIMES, 'first': ['news']}
            r = inbox(body)
            print(f"{p}: {r.get('followers')} followers, {r.get('posts')} posts, {r.get('views')} views")
        except Exception as e:  # one platform failing should not stop the others
            failed += 1
            print(f'{p} FAILED: {e}')
    for name, cfg in SERIES.items():  # each serialized channel's own YouTube account, under its own Inbox channel
        if not cfg.get('app'):
            continue
        try:
            s = social({'action': 'stats', 'platform': 'youtube', 'account': cfg['account'], 'limit': 50})
            views.update({x['url']: (x.get('views'), x.get('at')) for x in s.get('posts', []) if x.get('url')})
            r = inbox({'action': 'channelStats', 'app': cfg['app'], 'platform': 'youtube', 'followers': s.get('followers'),
                       'posts': s.get('posts', [])})
            print(f"{name}: {r.get('followers')} followers, {r.get('posts')} posts, {r.get('views')} views")
        except Exception as e:  # a channel not connected yet should not stop the others
            failed += 1
            print(f'{name} FAILED: {e}')
    try:
        snapshot(views)
    except Exception as e:  # the daily numbers above are already sent
        failed += 1
        print(f'day 2 / day 7 snapshot FAILED: {e}')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
