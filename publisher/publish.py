#!/usr/bin/env python3
"""Posts approved How To Hero videos from the Inbox through Social Manager.

Each run takes the first approved news video (its slot is ignored), else the first approved video whose slot
has passed (by slot; a video with no slot first gets the next free day at 19:30 IST), publishes it to
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
Each run first writes data.links on pending and approved videos: the main video plus one Drive link per platform
version, so the Inbox card and Telegram message offer every version (LINKS_ONLY=true stops after that).
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
import urllib.error
import urllib.request

WAIT_SECONDS = 15 * 60
MAX_RETRIES = 2  # retries per platform within one run
MAX_RUNS = 3  # runs a platform may fail before the publisher gives up on it
DRY = '--dry-run' in sys.argv
ITEM_ID = os.environ.get('ITEM_ID', '').strip()
POST_NOW = os.environ.get('POST_NOW') == 'true'
LINKS_ONLY = os.environ.get('LINKS_ONLY') == 'true'
# What each platform accepts (maxSeconds, versionSeconds): platforms/<name>.json, one file per platform.
PLATFORM_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'platforms')
RULES = {f[:-5]: json.load(open(os.path.join(PLATFORM_DIR, f))) for f in os.listdir(PLATFORM_DIR) if f.endswith('.json')}

SERIES = RULES.get('youtube', {}).get('channels', {})  # serialized channels, e.g. anaadi

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


IST = dt.timezone(dt.timedelta(hours=5, minutes=30))
DAILY_SLOT = dt.time(19, 30)  # where a video without a slot goes: the next day nobody else has


def slot_unslotted(items):
    """Give every approved non-news video that has no slot the next free day at 19:30 IST, and save it on the
    Inbox card, so it waits its turn like the rest instead of posting at the very next run."""
    todo = [i for i in items if when(i) is None and not is_news(i)]
    if not todo or POST_NOW or DRY:
        return
    taken = set()
    for st in ('approved', 'pending'):
        for i in inbox({'action': 'list', 'status': st, 'type': 'video', 'limit': 1000})['items']:
            if when(i) and not series_name(i):
                taken.add(when(i).astimezone(IST).date())
    day = dt.datetime.now(IST).date()  # empty days first, so a new video does not wait behind months of queue
    for i in sorted(todo, key=lambda i: i.get('createdAt') or ''):
        day += dt.timedelta(days=1)
        while day in taken:
            day += dt.timedelta(days=1)
        i['slot'] = dt.datetime.combine(day, DAILY_SLOT, IST).isoformat()
        fresh = inbox({'action': 'get', 'id': i['id']})['item']
        inbox({'action': 'update', 'id': i['id'], 'ifVersion': fresh['version'], 'set': {'slot': i['slot']}})
        print(f"slotted {i['id']} for {i['slot']}")


def is_news(i):
    return i.get('source') == 'news' or str(i['id']).startswith('news-')


def due_items():
    now = dt.datetime.now(dt.timezone.utc)
    if ITEM_ID:  # a manual run that names one video posts it now; a posted one gets its missing platforms
        items = inbox({'action': 'list', 'status': 'approved,posted', 'type': 'video', 'limit': 1000})['items']
        return [i for i in items if i['id'] == ITEM_ID and i.get('driveId') and not series_name(i)]
    # 1000 is the Inbox's largest page; the queue must never outgrow it, or videos past it are never posted.
    res = inbox({'action': 'list', 'status': 'approved', 'type': 'video', 'limit': 1000})
    if res.get('total', 0) > len(res['items']):
        print(f"WARNING: {res['total']} approved videos but only {len(res['items'])} read; the rest are skipped")
    items = [i for i in res['items'] if not series_name(i)]  # serialized channels go through run_series, never to How To Hero
    slot_unslotted([i for i in items if i.get('driveId')])
    # News goes out at the next run whatever its slot says: a story a day late has lost most of its reach.
    due = [i for i in items if i.get('driveId') and (POST_NOW or is_news(i) or when(i) is None or when(i) <= now)]
    return sorted(due, key=lambda i: (not is_news(i), when(i) or now))


# Platforms not posted to yet and why, shown on the Inbox card. Drop one here when it goes live in PLATFORMS.
NOT_YET = {
    'linkedin': 'Page posting not approved yet',
}


def live_platforms():
    wanted = [p.strip() for p in os.environ.get('PLATFORMS', 'instagram,facebook,youtube').split(',') if p.strip()]
    live, down = [], {}
    for p in wanted:
        try:
            social({'action': 'channel', 'platform': p})
            live.append(p)
        except RuntimeError as e:
            print(f'{p} is not connected: {e}')
            down[p] = f'channel not connected: {e}'
    return live, down


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
    limit = (RULES.get(platform) or {}).get('maxSeconds')
    if not limit or item['id'].startswith('doc-') or video_seconds(item, data, cache) <= limit:
        return item['driveId']  # the full video whenever it fits
    return (data.get('versions') or {}).get(platform)


GH_API = 'https://api.github.com'
IG_RELEASE = 'instagram-uploads'  # a release in this repository whose files are the public links Instagram fetches
IG_KEEP_DAYS = 3


def gh(method, url, data=None, content_type='application/json'):
    req = urllib.request.Request(url, data=data, method=method, headers={
        'Authorization': f"Bearer {os.environ['GITHUB_TOKEN']}", 'Accept': 'application/vnd.github+json',
        'Content-Type': content_type})
    with urllib.request.urlopen(req, timeout=300) as r:
        body = r.read()
    return json.loads(body.decode()) if body else None


def ig_release():
    repo = os.environ['GITHUB_REPOSITORY']
    try:
        return gh('GET', f'{GH_API}/repos/{repo}/releases/tags/{IG_RELEASE}')
    except urllib.error.HTTPError as e:
        if e.code != 404:
            raise
    return gh('POST', f'{GH_API}/repos/{repo}/releases', json.dumps({
        'tag_name': IG_RELEASE, 'name': 'Instagram uploads', 'prerelease': True, 'make_latest': 'false',
        'body': 'Short-lived copies of videos on their way to Instagram, which fetches each one from its link here. '
                'publisher/publish.py adds and removes them.'}).encode())


def public_link(path, name, content_type='video/mp4'):
    """Puts the file on this repository's "instagram-uploads" release and returns its public link. Files older
    than IG_KEEP_DAYS are removed on the way."""
    rel = ig_release()
    old = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=IG_KEEP_DAYS)
    for a in rel.get('assets') or []:
        if a['name'] == name or dt.datetime.fromisoformat(a['created_at'].replace('Z', '+00:00')) < old:
            gh('DELETE', a['url'])
    with open(path, 'rb') as fh:
        asset = gh('POST', f"https://uploads.github.com/repos/{os.environ['GITHUB_REPOSITORY']}/releases/{rel['id']}/assets?name={name}",
                   fh.read(), content_type)
    return asset['browser_download_url']


def remove_public_link(name):
    try:
        for a in ig_release().get('assets') or []:
            if a['name'] == name:
                gh('DELETE', a['url'])
    except (KeyError, OSError) as e:
        print(f'public link not removed: {e}')


def instagram_video(item, data):
    """What Instagram gets: a public link to a copy of the video, which Instagram fetches itself, and the same copy
    in Drive as the fallback (data.igDriveId, made once). Sending the file to Meta's upload host instead was refused
    about two times in three, with any encoding (platforms/instagram.json). The copy is a plain libx264 re-encode
    with the index at the front (faststart), so it plays from a link."""
    name = f"{item['id']}-instagram.mp4"
    with tempfile.TemporaryDirectory() as d:
        src, out = os.path.join(d, 'in.mp4'), os.path.join(d, 'ig.mp4')
        with open(src, 'wb') as fh:
            fh.write(base64.b64decode(inbox({'action': 'download', 'id': item['id']})['base64']))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-c:v', 'libx264', '-preset', 'fast', '-crf', '20',
                        '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', out], check=True)
        if not data.get('igDriveId'):
            session = inbox({'action': 'uploadUrl', 'id': item['id'], 'name': name,
                             'size': os.path.getsize(out), 'replaceExisting': True})
            with open(out, 'rb') as fh:
                req = urllib.request.Request(session['uploadUrl'], data=fh.read(), method='PUT',
                                             headers={'Content-Type': 'video/mp4'})
            with urllib.request.urlopen(req, timeout=300) as r:
                data['igDriveId'] = json.loads(r.read().decode())['id']
        video = {'driveFileId': data['igDriveId']}
        try:
            video['url'] = public_link(out, name)
            print(f"instagram fetches its copy from {video['url']}")
        except (KeyError, OSError) as e:  # no GITHUB_TOKEN (a run outside Actions) or GitHub is down
            print(f'no public link for instagram ({e}); it gets the Drive file')
    return video


def instagram_cover(item, data):
    """A public link to the video's thumbnail (data.thumb, a Drive file the build made with pipeline2/thumb.mjs) for
    Instagram's cover_url, or None. The release sweep removes it after IG_KEEP_DAYS."""
    if not data.get('thumb') or not os.environ.get('GITHUB_TOKEN'):
        return None
    try:
        got = inbox({'action': 'download', 'id': item['id'], 'driveId': data['thumb']})
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, 'cover.jpg')
            with open(path, 'wb') as fh:
                fh.write(base64.b64decode(got['base64']))
            return public_link(path, f"{item['id']}-cover.jpg", 'image/jpeg')
    except (KeyError, OSError, RuntimeError) as e:  # no cover is better than no post
        print(f'no instagram cover ({e})')
        return None


def job_exists(key):
    try:
        return bool(social({'action': 'get', 'key': key})['job'])
    except RuntimeError:
        return False


def fallback_text(item, data):
    """Public text for a card that has no caption of its own. Built from the title and the card's hook/aha lines,
    never from the card's summary or note, which are internal."""
    lines = [str(data.get(k) or '').strip() for k in ('hook', 'aha')]
    return '\n'.join([(item.get('title') or '').strip()] + [l for l in lines if l] + ['Follow @howtohero.official #shorts']).strip()


def post_for(platform, item, data, cache):
    # data.meta.<platform> (written by the build from platforms/<platform>.json "metadata") wins over the shared yt/ig text
    meta = ((data.get('meta') or {}).get(platform) or {}) if isinstance(data.get('meta'), dict) else {}
    title = (meta.get('title') or data.get('yt') or item.get('title') or '').strip()
    caption = (meta.get('text') or data.get('ig') or fallback_text(item, data)).strip()
    file_id = platform_file(platform, item, data, cache)
    key = f"{item['id']}-{platform}" + ('-version' if file_id != item['driveId'] else '')  # its own job
    video = {'driveFileId': file_id}
    if platform == 'instagram' and file_id == item['driveId']:
        key = f"{item['id']}-instagram-link"
        if not job_exists(key):  # a job from an earlier run carries on with the video it has
            video = instagram_video(item, data)
    if platform == 'instagram':
        post = {'platform': platform, 'key': key, 'video': video, 'caption': caption}
        cover = None if job_exists(key) else instagram_cover(item, data)
        if cover:
            post['coverUrl'] = cover
        return post
    if platform == 'facebook':
        return {'platform': platform, 'key': key, 'video': video, 'title': title.replace('#shorts', '').strip()[:255], 'description': caption}
    if platform == 'linkedin':
        text = '\n'.join(l for l in caption.splitlines() if not l.startswith('Follow @'))
        return {'platform': platform, 'key': key, 'video': video, 'text': text[:3000]}
    if platform == 'youtube':
        post = {'platform': platform, 'key': key, 'video': video, 'title': title[:100], 'description': caption[:5000],
                'privacy': 'public', 'categoryId': 28, 'madeForKids': False}
        if data.get('thumb'):  # custom thumbnail (pipeline2/thumb.mjs); a refused one is only a warning on the job
            post['thumbnail'] = {'driveFileId': data['thumb']}
        return post
    raise ValueError(platform)


def video_links(item, data):
    """{label: url} for the Inbox card: the main video, each platform version (data.versions.<platform>) and the thumbnail."""
    links = {'Main': item['link']} if item.get('link') else {}
    for p, file_id in sorted((data.get('versions') or {}).items()):
        links[p.capitalize()] = f'https://drive.google.com/file/d/{file_id}/view'
    if data.get('thumb'):
        links['Thumbnail'] = f"https://drive.google.com/file/d/{data['thumb']}/view"
    return links


def sync_links():
    """Writes data.links on every pending or approved video whose links are missing or out of date."""
    for item in inbox({'action': 'list', 'status': 'pending,approved', 'type': 'video', 'limit': 1000})['items']:
        data = item['data'] if isinstance(item.get('data'), dict) else {}
        links = video_links(item, data)
        if len(links) < 2 or data.get('links') == links:
            continue  # one link is the item's own Open button already
        print(f"links for {item['id']}: {', '.join(links)}")
        if not DRY:
            inbox({'action': 'update', 'id': item['id'], 'ifVersion': item['version'], 'set': {'data': dict(data, links=links)}})

def series_name(item):
    """The serialized channel an item belongs to (platforms/youtube.json "channels"), or None for How To Hero."""
    data = item.get('data') if isinstance(item.get('data'), dict) else {}
    name = str(data.get('channel') or '').strip().lower()
    return name if name in SERIES else None


def series_groups(name):
    """The groups (sub-series) of a serialized channel: its main one ("group") plus any in "groups"."""
    cfg = SERIES[name]
    return [cfg.get('group', '')] + list(cfg.get('groups', {}))


def group_of(item, name):
    """An item's group key: data.group, or the channel's main group when it has none. None for an unknown group."""
    cfg = SERIES[name]
    g = str((item.get('data') or {}).get('group') or cfg.get('group', '')).strip().lower()
    return g if g in series_groups(name) else None


def episode_of(item):
    try:
        return int((item.get('data') or {}).get('episode'))
    except (TypeError, ValueError):
        return None


def run_series(name, group=''):
    """Uploads the next episode of one group of a serialized channel, scheduled on YouTube.
    Each group numbers its own episodes and has its own time, pace and playlist. Returns 1 on a failed upload."""
    cfg = {k: v for k, v in SERIES[name].items() if k != 'groups'}
    if group != cfg.get('group', ''):
        cfg.update(SERIES[name]['groups'][group])
        name = f'{name}/{group}'
    channel = name.split('/')[0]
    every = [i for i in inbox({'action': 'list', 'status': 'approved,posted', 'type': 'video', 'limit': 1000})['items']
             if series_name(i) == channel]
    if group == SERIES[channel].get('group', ''):  # once per channel: a mistyped data.group would never post
        for i in every:
            if i['status'] == 'approved' and group_of(i, channel) is None and not DRY:
                alert(f"alert-{i['id']}-group", f"{channel}: unknown group on \"{i.get('title')}\"",
                      f"data.group is \"{i['data'].get('group')}\"; use one of {', '.join(series_groups(channel))}. It will not post until fixed.")
    items = [i for i in every if group_of(i, channel) == group and episode_of(i)]
    last_ep = cfg['after']['episode']
    last_at = dt.datetime.fromisoformat(cfg['after']['publishAt'])
    for i in items:
        at = (i.get('data') or {}).get('publishAt')
        if i['status'] == 'posted' and at and episode_of(i) > last_ep:
            last_ep, last_at = episode_of(i), dt.datetime.fromisoformat(at)
    nxt = [i for i in items if i['status'] == 'approved' and episode_of(i) == last_ep + 1 and i.get('driveId')]
    if not nxt:
        print(f'{name}: episode {last_ep + 1} is not approved yet; later episodes wait for it')
        return 0
    item = nxt[0]
    data = dict(item['data'])
    ist = dt.timezone(dt.timedelta(hours=5, minutes=30))
    hh, mm = map(int, cfg['timeIST'].split(':'))
    at = (last_at.astimezone(ist) + dt.timedelta(days=cfg['everyDays'])).replace(hour=hh, minute=mm, second=0, microsecond=0)
    soon = dt.datetime.now(ist) + dt.timedelta(hours=1)
    while at < soon:  # YouTube needs a future time; a gap in the bank pushes the next episode on
        at += dt.timedelta(days=cfg['everyDays'])
    meta = (data.get('meta') or {}).get('youtube') or {}
    post = {'action': 'publish', 'platform': 'youtube', 'account': cfg['account'], 'key': f"{item['id']}-youtube",
            'video': {'driveFileId': item['driveId']},
            'title': (meta.get('title') or item.get('title') or '')[:100],
            'description': (meta.get('text') or fallback_text(item, data))[:5000],
            'privacy': 'private', 'publishAt': at.isoformat(), 'categoryId': cfg['categoryId'],
            'language': cfg['language'], 'aiGenerated': cfg['aiGenerated'], 'madeForKids': False}
    if data.get('thumb'):
        post['thumbnail'] = {'driveFileId': data['thumb']}
    if cfg.get('playlist'):  # Social Manager makes it on first use; a failure is only a warning
        post['playlists'] = [cfg['playlist']]
    print(f"{name}: uploading episode {episode_of(item)} ({item['id']}), goes live {at.isoformat()}")
    if DRY:
        return 0
    job = social(post)['job']
    deadline = time.time() + WAIT_SECONDS
    while job['status'] in ('queued', 'running') and time.time() < deadline:
        time.sleep(20)
        job = social({'action': 'get', 'id': job['id']})['job']
    fresh = inbox({'action': 'get', 'id': item['id']})['item']
    if job['status'] == 'done':
        url = (job.get('result') or {}).get('url')
        at = dt.datetime.fromisoformat(str((job.get('result') or {}).get('publishAt') or at.isoformat()).replace('Z', '+00:00')).astimezone(ist)
        posted = dict(data.get('posted') or {}, youtube=url)
        inbox({'action': 'update', 'id': item['id'], 'ifVersion': fresh['version'], 'set': {
            'status': 'posted', 'data': dict(data, posted=posted, publishAt=at.isoformat(), postedAt=at.isoformat())}})
        print(f'{name}: scheduled {url}')
        return 0
    fails = int(data.get('publishFails', 0)) + 1 if job['status'] == 'failed' else int(data.get('publishFails', 0))
    inbox({'action': 'update', 'id': item['id'], 'ifVersion': fresh['version'], 'set': {
        'data': dict(data, publishFails=fails), 'note': f"Publisher: YouTube {job['status']}: {job.get('error') or 'still running'}"}})
    if fails >= MAX_RUNS:
        alert(f"alert-{item['id']}-youtube-{fails}", f"{name}: episode {episode_of(item)} will not upload",
              f"YouTube failed {fails} runs in a row: {job.get('error')}. Later episodes wait until it goes out.")
    if job['status'] == 'failed' and job.get('id'):
        social({'action': 'retry', 'id': job['id']})  # the next run picks the same job up again
    return 1 if job['status'] == 'failed' else 0


LATE_HOURS = 3  # a video still unposted this long after its slot means publish runs were missed


def alert(alert_id, title, summary):
    """A to-do in the Inbox, which Telegram sends as a message. The fixed id makes each alert go out once."""
    try:
        inbox({'action': 'add', 'id': alert_id, 'type': 'todo', 'status': 'pending', 'title': title, 'summary': summary,
               'data': {'app': 'How To Hero', 'icon': '🚨'}})
        print(f'alert sent: {title}')
    except (RuntimeError, OSError) as e:  # an id that exists already means this alert went out before
        print(f'alert not sent ({e})')


def close_late_alert(item_id):
    """Once a late video is posted, its "Publishing is behind" to-do is out of date, so close it."""
    try:
        alert = inbox({'action': 'get', 'id': f'alert-late-{item_id}'})['item']
        if alert.get('status') == 'pending':
            inbox({'action': 'update', 'id': alert['id'], 'ifVersion': alert['version'], 'set': {'status': 'done'}})
            print(f'closed {alert["id"]}')
    except (RuntimeError, OSError, KeyError):  # no alert for this video, or the Inbox said no: nothing to close
        pass


def late_alert(items):
    now = dt.datetime.now(dt.timezone.utc)
    late = [i for i in items if when(i) and now - when(i) > dt.timedelta(hours=LATE_HOURS)]
    if late and not DRY:
        i = late[0]
        alert(f"alert-late-{i['id']}", f"Publishing is behind: {len(late)} video(s) missed their slot",
              f"\"{i.get('title')}\" was due at {i.get('slot')} and is still not posted. Check the latest publish runs in GitHub Actions.")


def run():
    try:
        sync_links()
    except (RuntimeError, OSError, KeyError) as e:  # never let this stop a post
        print(f'links not synced: {e}')
    if LINKS_ONLY:
        return 0
    series_failed = 0
    if not ITEM_ID:
        for name in SERIES:
            for group in series_groups(name):
                try:
                    series_failed |= run_series(name, group)
                except (RuntimeError, OSError, KeyError, ValueError) as e:  # never let it stop How To Hero's post
                    print(f'{name}/{group}: {e}')
                    series_failed = 1
    items = due_items()
    if not items:
        print('nothing due')
        return series_failed
    if not ITEM_ID:
        late_alert(items)
    item = items[0]
    data = dict(item.get('data')) if isinstance(item.get('data'), dict) else {}
    platforms, down = live_platforms()
    print(f"posting {item['id']} (slot {item.get('slot')}) to {', '.join(platforms) or 'nothing'}; {len(items) - 1} more due")
    if DRY or not platforms:
        return 0 if platforms else 1

    # A platform whose channel is down counts as a failed post, so the video stays approved and the
    # next run tries it again instead of marking it posted without that platform.
    jobs = {p: {'id': None, 'status': 'failed', 'error': e} for p, e in down.items()}
    cache, no_version = {}, {}
    for p in platforms:
        if (data.get('posted') or {}).get(p):
            continue  # already there: never post a platform twice, whatever key its job had
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

    if jobs.get('instagram', {}).get('status') == 'done' and os.environ.get('GITHUB_TOKEN'):
        remove_public_link(f"{item['id']}-instagram.mp4")
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
    if set_.get('status') == 'posted':
        close_late_alert(item['id'])
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(run())
