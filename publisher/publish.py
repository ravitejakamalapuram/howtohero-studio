#!/usr/bin/env python3
"""Posts approved How To Hero videos from the Inbox through Social Manager.

Each run takes the first approved video whose slot has passed (news first, then by slot), publishes it to
every platform in PLATFORMS that is connected, waits for the jobs, then marks the item "posted" in the Inbox
with the post links in data.posted. One video per run, so a backlog goes out one run apart.

An item counts as posted only once every platform has succeeded. A platform that still fails after this
run's retries leaves the item approved, so the next run tries that platform again (platforms already done
return their first job and don't post twice). After MAX_RUNS failed runs on one platform the publisher gives
up on it, marks the item posted (or "ready" if nothing posted) and says why in the note.

Safe to run again at any time: each post uses the key "<item id>-<platform>", so Social Manager returns
the first job instead of posting twice.

Needs INBOX_URL, INBOX_TOKEN, SOCIAL_URL and SOCIAL_TOKEN. PLATFORMS defaults to "instagram,facebook,youtube". LinkedIn is left out: the connected account is a personal profile.
YouTube uploads go out public (tested 16 Nov 2026: no API audit needed).
Run with --dry-run to see what it would post.
Manual runs can set POST_NOW=true (ignore the slot, take the next approved video) or ITEM_ID=<id> (post that
approved video now). Either way only approved videos go out, and the per-platform key still stops double posts.
"""
import base64
import datetime as dt
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.request

WAIT_SECONDS = 15 * 60
MAX_RETRIES = 2  # retries per platform within one run
MAX_RUNS = 3  # runs a platform may fail before the publisher gives up on it
DRY = '--dry-run' in sys.argv
ITEM_ID = os.environ.get('ITEM_ID', '').strip()
POST_NOW = os.environ.get('POST_NOW') == 'true'
# What each platform accepts (maxSeconds, versionSeconds): platforms/<name>.json, one file per platform.
PLATFORM_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'platforms')
RULES = {f[:-5]: json.load(open(os.path.join(PLATFORM_DIR, f))) for f in os.listdir(PLATFORM_DIR) if f.endswith('.json')}


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
    if ITEM_ID:  # a manual run that names one video posts it now, if it is approved
        return [i for i in items if i['id'] == ITEM_ID and i.get('driveId')]
    due = [i for i in items if i.get('driveId') and (POST_NOW or when(i) is None or when(i) <= now)]
    is_news = lambda i: i.get('source') == 'news' or str(i['id']).startswith('news-')
    return sorted(due, key=lambda i: (not is_news(i), when(i) or now))


# Platforms not posted to yet and why, shown on the Inbox card. Drop one here when it goes live in PLATFORMS.
NOT_YET = {
    'linkedin': 'Page posting not approved yet',
}


def live_platforms():
    wanted = [p.strip() for p in os.environ.get('PLATFORMS', 'instagram,facebook,youtube').split(',') if p.strip()]
    live = []
    for p in wanted:
        try:
            social({'action': 'channel', 'platform': p})
            live.append(p)
        except RuntimeError as e:
            print(f'skip {p}: {e}')
    return live


def video_seconds(item, data, cache):
    """The video's length: from data.videoRef ("<file> | 47.3 s | ...") when the build wrote it, else measured."""
    m = re.search(r'\|\s*([\d.]+)\s*s\s*\|', str(data.get('videoRef') or ''))
    if m:
        return float(m.group(1))
    if 'seconds' not in cache:
        with tempfile.TemporaryDirectory() as d:
            src = os.path.join(d, 'in.mp4')
            with open(src, 'wb') as fh:
                fh.write(base64.b64decode(inbox({'action': 'download', 'id': item['id']})['base64']))
            cache['seconds'] = float(subprocess.check_output(
                ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src]).decode().strip())
    return cache['seconds']


def platform_file(platform, item, data, cache):
    """The Drive id this platform gets, or None when it needs its own version and has none yet. A video longer than
    the platform's maxSeconds (platforms/<name>.json) is never cut here: the video build makes a separate version
    (data.versions.<platform>) with its own hook, payoff and end card."""
    version = (data.get('versions') or {}).get(platform)
    if version:
        return version
    limit = (RULES.get(platform) or {}).get('maxSeconds')
    if not limit or item['id'].startswith('doc-') or video_seconds(item, data, cache) <= limit:
        return item['driveId']
    return None


def post_for(platform, item, data, cache):
    title = (data.get('yt') or item.get('title') or '').strip()
    caption = (data.get('ig') or item.get('summary') or title).strip()
    file_id = platform_file(platform, item, data, cache)
    video = {'driveFileId': file_id}
    key = f"{item['id']}-{platform}" + ('-version' if file_id != item['driveId'] else '')  # its own job
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
    data = dict(item.get('data')) if isinstance(item.get('data'), dict) else {}
    platforms = live_platforms()
    print(f"posting {item['id']} (slot {item.get('slot')}) to {', '.join(platforms) or 'nothing'}; {len(items) - 1} more due")
    if DRY or not platforms:
        return 0 if platforms else 1

    jobs, cache, no_version = {}, {}, {}
    for p in platforms:
        try:
            if platform_file(p, item, data, cache) is None:
                no_version[p] = f"needs its own {p} version of {RULES[p]['versionSeconds']} s or less (the video build makes it)"
                print(f'skip {p}: {no_version[p]}')
                continue
            jobs[p] = social(dict(post_for(p, item, data, cache), action='publish'))['job']
        except (RuntimeError, OSError, subprocess.CalledProcessError, ValueError, KeyError) as e:
            jobs[p] = {'id': None, 'status': 'failed', 'error': f'not started: {e}'}
    retries = {}
    deadline = time.time() + WAIT_SECONDS
    while True:
        for p, j in list(jobs.items()):
            if j['status'] == 'failed' and j['id'] and retries.get(p, 0) < MAX_RETRIES:
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

    fails = dict(data.get('publishFails') or {})
    for p in failed:
        fails[p] = fails.get(p, 0) + 1
    retry_later = [p for p in failed if fails[p] < MAX_RUNS]
    # failed holds only destinations still without a post, so the Inbox card shows a cross for each.
    still_failed = {p: e for p, e in dict(data.get('failed') or {}, **failed).items() if p not in posted}
    # Platforms this run did not post to: the Inbox card shows them as yellow "not posted yet" chips.
    later = {p: why for p, why in dict(NOT_YET, **no_version).items() if p not in posted and p not in still_failed}
    new_data = dict(data, posted=posted, failed=still_failed, pending=later, publishFails=fails)
    new_data.pop('publishRetries', None)
    if posted and not data.get('postedAt'):  # the Inbox Channels page dates posts by this
        new_data['postedAt'] = dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')
    fresh = inbox({'action': 'get', 'id': item['id']})['item']
    set_ = {'data': new_data}
    if not waiting and not retry_later:
        # Every platform is done or given up. Nothing posted at all: move it out of the queue
        # so it doesn't block the videos behind it.
        set_['status'] = 'posted' if posted else 'ready'
    if failed:
        set_['note'] = 'Publisher: ' + '; '.join(
            f'{p} failed ({fails[p]} of {MAX_RUNS} runs): {e}' for p, e in failed.items())
    inbox({'action': 'update', 'id': item['id'], 'ifVersion': fresh['version'], 'set': set_})
    print('marked posted' if set_.get('status') == 'posted' else 'left approved; the next run carries on')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(run())
