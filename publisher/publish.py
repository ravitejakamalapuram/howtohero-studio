#!/usr/bin/env python3
"""Posts approved How To Hero videos from the Inbox through Social Manager.

Each run takes the first approved video whose slot has passed (news first, then by slot), publishes it to
every platform in PLATFORMS that is connected, waits for the jobs, then marks the item "posted" in the Inbox
with the post links in data.posted. One video per run, so a backlog goes out one run apart.

Safe to run again at any time: each post uses the key "<item id>-<platform>", so Social Manager returns
the first job instead of posting twice.

Needs INBOX_URL, INBOX_TOKEN, SOCIAL_URL and SOCIAL_TOKEN. PLATFORMS defaults to "instagram,facebook". LinkedIn is left out: the connected account is a personal profile.
YouTube is left out until the API audit passes: before that, API uploads stay private for good.
Run with --dry-run to see what it would post.
"""
import datetime as dt
import json
import os
import sys
import time
import urllib.request

WAIT_SECONDS = 15 * 60
MAX_RETRIES = 2
DRY = '--dry-run' in sys.argv


def call(url, token, body):
    body = dict(body, token=token)
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=120) as r:  # Apps Script answers POST with a redirect to GET
        out = json.loads(r.read().decode())
    if not out.get('ok'):
        raise RuntimeError(f"{body['action']}: {out.get('error')}")
    return out


def inbox(body):
    return call(os.environ['INBOX_URL'], os.environ['INBOX_TOKEN'], body)


def social(body):
    return call(os.environ['SOCIAL_URL'], os.environ['SOCIAL_TOKEN'], body)


def when(item):
    try:
        return dt.datetime.fromisoformat(item['slot'])
    except (KeyError, TypeError, ValueError):
        return None


def due_items():
    now = dt.datetime.now(dt.timezone.utc)
    items = inbox({'action': 'list', 'status': 'approved', 'type': 'video', 'limit': 200})['items']
    due = [i for i in items if i.get('driveId') and (when(i) is None or when(i) <= now)]
    is_news = lambda i: i.get('source') == 'news' or str(i['id']).startswith('news-')
    return sorted(due, key=lambda i: (not is_news(i), when(i) or now))


def live_platforms():
    wanted = [p.strip() for p in os.environ.get('PLATFORMS', 'instagram,facebook').split(',') if p.strip()]
    live = []
    for p in wanted:
        try:
            social({'action': 'channel', 'platform': p})
            live.append(p)
        except RuntimeError as e:
            print(f'skip {p}: {e}')
    return live


def post_for(platform, item, data):
    title = (data.get('yt') or item.get('title') or '').strip()
    caption = (data.get('ig') or item.get('summary') or title).strip()
    video = {'driveFileId': item['driveId']}
    key = f"{item['id']}-{platform}"
    if platform == 'instagram':
        return {'platform': platform, 'key': key, 'video': video, 'caption': caption}
    if platform == 'facebook':
        return {'platform': platform, 'key': key, 'video': video, 'title': title.replace('#shorts', '').strip()[:255], 'description': caption}
    if platform == 'linkedin':
        text = '\n'.join(l for l in caption.splitlines() if not l.startswith('Follow @'))
        return {'platform': platform, 'key': key, 'video': video, 'text': text[:3000]}
    if platform == 'youtube':
        return {'platform': platform, 'key': key, 'video': video, 'title': title[:100], 'description': caption[:5000],
                'privacy': 'public', 'categoryId': 28, 'madeForKids': False}
    raise ValueError(platform)


def run():
    items = due_items()
    if not items:
        print('nothing due')
        return 0
    item = items[0]
    data = item.get('data') if isinstance(item.get('data'), dict) else {}
    platforms = live_platforms()
    print(f"posting {item['id']} (slot {item.get('slot')}) to {', '.join(platforms) or 'nothing'}; {len(items) - 1} more due")
    if DRY or not platforms:
        return 0 if platforms else 1

    jobs = {p: social(dict(post_for(p, item, data), action='publish'))['job'] for p in platforms}
    retries = dict(data.get('publishRetries') or {})
    deadline = time.time() + WAIT_SECONDS
    while True:
        for p, j in list(jobs.items()):
            if j['status'] == 'failed' and retries.get(p, 0) < MAX_RETRIES:
                retries[p] = retries.get(p, 0) + 1
                print(f"{p} failed ({j['error']}), retry {retries[p]}")
                jobs[p] = social({'action': 'retry', 'id': j['id']})['job']
            elif j['status'] in ('queued', 'running'):
                jobs[p] = social({'action': 'get', 'id': j['id']})['job']
        if all(j['status'] in ('done', 'failed') for j in jobs.values()) or time.time() > deadline:
            break
        time.sleep(30)

    posted = dict(data.get('posted') or {})
    posted.update({p: j['result'].get('url') for p, j in jobs.items() if j['status'] == 'done'})
    failed = {p: j['error'] for p, j in jobs.items() if j['status'] == 'failed'}
    waiting = [p for p, j in jobs.items() if j['status'] in ('queued', 'running')]
    for p, u in posted.items():
        print(f'{p}: {u}')
    for p, e in failed.items():
        print(f'{p} FAILED: {e}')

    # failed holds only destinations still without a post, so the Inbox card shows a cross for each.
    still_failed = {p: e for p, e in dict(data.get('failed') or {}, **failed).items() if p not in posted}
    new_data = dict(data, posted=posted, failed=still_failed, publishRetries=retries)
    fresh = inbox({'action': 'get', 'id': item['id']})['item']
    done = not waiting and not any(retries.get(p, 0) < MAX_RETRIES for p in failed)
    set_ = {'data': new_data}
    if done:
        # Nothing posted at all: move it out of the queue so it doesn't block the videos behind it.
        set_['status'] = 'posted' if posted else 'ready'
    if failed:
        set_['note'] = 'Publisher: ' + '; '.join(f'{p} failed: {e}' for p, e in failed.items())
    inbox({'action': 'update', 'id': item['id'], 'ifVersion': fresh['version'], 'set': set_})
    print('marked posted' if set_.get('status') == 'posted' else 'left approved; the next run carries on')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(run())
