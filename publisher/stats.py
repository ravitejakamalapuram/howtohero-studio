#!/usr/bin/env python3
"""Sends How To Hero's daily numbers to the Inbox Channels page.

For each platform in PLATFORMS it reads followers and the newest posts' likes, comments and views from
Social Manager (action "stats") and passes them to the Inbox (action "channelStats"). Running it twice on
one day replaces that day's numbers. Needs INBOX_URL, INBOX_TOKEN, SOCIAL_URL and SOCIAL_TOKEN.
"""
import os
import sys

from publish import inbox, social

APP = 'How To Hero'  # the channel name on the Inbox Channels page
# The Inbox tokens that add How To Hero items. Those items carry no data.app, so the channel claims them by source.
SOURCES = ['queue', 'news']


def main():
    failed = 0
    for p in [x.strip() for x in os.environ.get('PLATFORMS', 'instagram,facebook').split(',') if x.strip()]:
        try:
            s = social({'action': 'stats', 'platform': p, 'limit': 50})
            body = {'action': 'channelStats', 'app': APP, 'platform': p, 'followers': s.get('followers'), 'posts': s.get('posts', []),
                    'sources': SOURCES}
            if os.environ.get('GITHUB_REPOSITORY'):  # lets the dashboard's "Post now" start publish.yml here,
                # and the Inbox's timer start it at the 3 daily slots (IST), since GitHub's schedule never fired
                body['publish'] = {'repo': os.environ['GITHUB_REPOSITORY'], 'workflow': 'publish.yml',
                                   'times': ['08:30', '13:00', '19:30'], 'first': ['news']}
            r = inbox(body)
            print(f"{p}: {r.get('followers')} followers, {r.get('posts')} posts, {r.get('views')} views")
        except Exception as e:  # one platform failing should not stop the others
            failed += 1
            print(f'{p} FAILED: {e}')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
