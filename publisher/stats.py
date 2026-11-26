#!/usr/bin/env python3
"""Sends every channel's daily numbers to the Inbox Channels page: the one stats job for all channels.

The channels come from the Inbox Channel config (action "channelConfig"). Each channel's numbers are read from the
Social Media Publisher accounts in its stats_from cell, else its post_to cell (platform, or youtube:account), with
action "stats", and passed to the Inbox (action "channelStats"). Until a row says, How To Hero reads PLATFORMS on the
main accounts and each serialized channel in platforms/youtube.json reads its own YouTube account. A channel with no
accounts is skipped, and so is another channel's account the publisher says is not connected yet; any other error,
or How To Hero's own accounts not connected, fails the run after the other channels are done. Other channels only
read named accounts (youtube:name): the main accounts are How To Hero's. Running it twice on one day replaces that day's numbers.
Needs INBOX_URL, INBOX_TOKEN, SOCIAL_URL and SOCIAL_TOKEN.
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


def plan():
    """{Inbox channel: {platform: Social Media Publisher account}}, '' for a platform's main account."""
    out = {APP: {p.strip(): '' for p in os.environ.get('PLATFORMS', 'instagram,facebook,youtube').split(',') if p.strip()}}
    out.update({c['app']: {'youtube': c['account']} for c in SERIES.values() if c.get('app') and c.get('account')})
    try:
        channels = inbox({'action': 'channelConfig'}).get('channels', {})
    except Exception as e:  # an older Inbox: the defaults above still send today's numbers
        print(f'channelConfig unavailable, using the defaults: {e}')
        channels = {}
    for app, c in channels.items():
        if c.get('statsFromError'):
            print(f"{app}: stats_from can't be read ({c['statsFromError']}); using post_to")
        wanted = c.get('statsFrom') or c.get('postTo') or {}
        if app != APP:  # a main account is How To Hero's: reading it here would file its numbers under another channel
            wanted = {p: a for p, a in wanted.items() if a}
        if wanted:
            out[app] = wanted
        elif app not in out:
            print(f'{app}: skipped, no stats_from or post_to in the Inbox Channel config')
    return out


def main():
    failed, views = 0, {}
    for app, accounts in plan().items():
        for p, account in accounts.items():
            name = f"{app} {p}" + (f':{account}' if account else '')
            try:
                s = social(dict({'action': 'stats', 'platform': p, 'limit': 50}, **({'account': account} if account else {})))
                views.update({x['url']: (x.get('views'), x.get('at')) for x in s.get('posts', []) if x.get('url')})
                body = {'action': 'channelStats', 'app': app, 'platform': p, 'followers': s.get('followers'), 'posts': s.get('posts', [])}
                if app == APP:
                    body['sources'] = SOURCES
                    if os.environ.get('GITHUB_REPOSITORY'):  # lets the dashboard's "Post now" start publish.yml here,
                        # and the Inbox's timer start it at the daily slots in TIMES (IST), since GitHub's schedule never fired
                        body['publish'] = {'repo': os.environ['GITHUB_REPOSITORY'], 'workflow': 'publish.yml',
                                           'times': TIMES, 'first': ['news']}
                r = inbox(body)
                print(f"{name}: {r.get('followers')} followers, {r.get('posts')} posts, {r.get('views')} views")
            except Exception as e:  # one account failing should not stop the others
                if app != APP and 'not_connected' in str(e):  # How To Hero's own accounts dropping out still fail the run
                    print(f'{name}: skipped, not connected in the Social Media Publisher yet')
                    continue
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
