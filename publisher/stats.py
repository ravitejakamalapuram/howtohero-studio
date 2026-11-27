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
import json
import os
import sys

from publish import CHANNELS, RULES, SERIES, inbox, social

APP = 'How To Hero'  # the channel name on the Inbox Channels page
# The Inbox tokens that add How To Hero items. Those items carry no data.app, so the channel claims them by source.
SOURCES = ['queue', 'news']
# When the Inbox starts publish.yml (IST): every platform's postTimesIST in platforms/<name>.json, merged.
# One run posts one video to every platform, so the platforms share these times. Each channel's own daily
# "time" or "times" in publisher/channels.json is added, so its videos go out at that time.
TIMES = sorted({t for r in RULES.values() for t in r.get('postTimesIST', [])}
               | {t for c in CHANNELS.values() for t in (c.get('times') or [c['time']] if c.get('time') or c.get('times') else [])}
               # and every slot of the series engine (publisher/series.json), each weekday's time of a weekday slot
               | {t for v in json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'series.json')))['slots'].values()
                  for t in (v.values() if isinstance(v, dict) else [v])})

# Workflows here that the Inbox timer starts on time (IST), because GitHub's own schedule runs hours late.
JOBS = [{'workflow': 'stats.yml', 'time': '06:53'}, {'workflow': 'learn.yml', 'time': '09:11', 'day': 'mon'}]


# How a video was watched, as Social Media Publisher returns it: Instagram's skip rate, watch time, shares and saves,
# and YouTube's engaged views (the ones that kept playing; the only Shorts views the Partner Programme counts).
WATCH = ('skipRate', 'avgWatchTime', 'shares', 'saves', 'engagedViews')


def aged(m, age, post):
    """One platform's stored numbers for a video (data.metrics.<platform>) after today's reading, or None when
    nothing new is due. Views are kept once at day 2 and once at day 7. The watch numbers (WATCH: the share that
    left in the first 3 seconds, average watch time, shares and saves on Instagram; engaged views on YouTube) are
    kept as m['watch'] with the day they were read and the views at that reading (so a share of views can be worked
    out): at day 2 for an early look, replaced once at day 7 by a reading that is at least as complete."""
    m, changed = dict(m or {}), False
    for day in (2, 7):
        if age >= day and f'd{day}' not in m and post.get('views') is not None:
            m[f'd{day}'] = post['views']
            changed = True
    watch = {k: post[k] for k in WATCH if post.get(k) is not None}
    day = 7 if age >= 7 else 2 if age >= 2 else 0
    old = m.get('watch') or {}
    # One reading is kept whole, so its numbers and its views belong together: the day-7 reading replaces the
    # day-2 one only when it has every number that one had (a refused metric at day 7 keeps the day-2 reading).
    if watch and day > old.get('day', 0) and all(k in watch for k in WATCH if k in old):
        m['watch'] = dict(watch, day=day, **({'views': post['views']} if post.get('views') is not None else {}))
        changed = True
    return m if changed else None


def snapshot(posts):
    """Stores each posted video's numbers at day 2 and day 7 in data.metrics.<platform> (see aged), so the weekly
    learn.py compares every video at the same age. posts: {post url: that post from Social Media Publisher's stats}."""
    now = dt.datetime.now(dt.timezone.utc)
    for item in inbox({'action': 'list', 'type': 'video', 'status': 'posted', 'limit': 1000})['items']:
        data = item.get('data') if isinstance(item.get('data'), dict) else {}
        metrics, changed = dict(data.get('metrics') or {}), False
        for platform, url in (data.get('posted') or {}).items():
            if url not in posts:
                continue
            try:
                age = (now - dt.datetime.fromisoformat(str(posts[url].get('at')).replace('Z', '+00:00'))).days
            except ValueError:
                continue
            m = aged(metrics.get(platform), age, posts[url])
            if m:
                metrics[platform], changed = m, True
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
    failed, posts = 0, {}
    for app, accounts in plan().items():
        for p, account in accounts.items():
            name = f"{app} {p}" + (f':{account}' if account else '')
            try:
                s = social(dict({'action': 'stats', 'platform': p, 'limit': 50}, **({'account': account} if account else {})))
                posts.update({x['url']: x for x in s.get('posts', []) if x.get('url')})
                body = {'action': 'channelStats', 'app': app, 'platform': p, 'followers': s.get('followers'), 'posts': s.get('posts', [])}
                if app == APP:
                    body['sources'] = SOURCES
                    if os.environ.get('GITHUB_REPOSITORY'):  # lets the dashboard's "Post now" start publish.yml here,
                        # and the Inbox's timer start it at the daily slots in TIMES (IST), since GitHub's schedule never fired
                        body['publish'] = {'repo': os.environ['GITHUB_REPOSITORY'], 'workflow': 'publish.yml',
                                           'times': TIMES, 'first': ['news']}
                        body['jobs'] = JOBS
                r = inbox(body)
                print(f"{name}: {r.get('followers')} followers, {r.get('posts')} posts, {r.get('views')} views")
            except Exception as e:  # one account failing should not stop the others
                if app != APP and 'not_connected' in str(e):  # How To Hero's own accounts dropping out still fail the run
                    print(f'{name}: skipped, not connected in the Social Media Publisher yet')
                    continue
                failed += 1
                print(f'{name} FAILED: {e}')
    try:
        snapshot(posts)
    except Exception as e:  # the daily numbers above are already sent
        failed += 1
        print(f'day 2 / day 7 snapshot FAILED: {e}')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
