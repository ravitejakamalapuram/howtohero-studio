#!/usr/bin/env python3
"""Posts approved videos from the Inbox through Social Media Publisher, for every channel in publisher/channels.json.

Each run does the following for each channel in turn (only that channel's cards, by data.app; a card of an app not
listed there is never posted). It takes the first approved news video (its slot is ignored), else the first approved video whose slot
has passed (by slot; a video with no slot first gets the next free one of its channel's daily times, 19:30 IST by default), publishes it to
every platform in PLATFORMS that is connected, waits for the jobs, then marks the item "posted" in the Inbox
with the post links in data.posted. One video per run, so a backlog goes out one run apart.

An item counts as posted only once every platform has succeeded. A platform that still fails after this
run's retries leaves the item approved, so the next run tries that platform again (platforms already done
return their first job and don't post twice). After MAX_RUNS failed runs on one platform the publisher gives
up on it, marks the item posted (or "ready" if nothing posted) and says why in the note.

Safe to run again at any time: each post uses the key "<item id>-<platform>", so Social Media Publisher returns
the first job instead of posting twice.

Needs INBOX_URL, INBOX_TOKEN, SOCIAL_URL and SOCIAL_TOKEN. Where to post comes from the Inbox: "post_to" in the
channel's row of its Channel config tab (platform, or platform:account for a Social Media Publisher account other than
the main one; YouTube, Instagram and Facebook). When that is empty, or the Inbox has no channelConfig yet, the default channel (How To Hero) uses
PLATFORMS, default "instagram,facebook,youtube"; any other channel posts nowhere. Any other Inbox error, or a post_to cell it can't read, stops the run instead of guessing.
LinkedIn is left out: the connected account is a personal profile.
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
# The channels posted one video at a time (publisher/channels.json), by Inbox app name. Each run posts the next due
# video of each, in turn; APP is the one being posted now. Cards with no data.app belong to the default channel.
CHANNELS = {k: v for k, v in json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'channels.json'))).items()
            if not k.startswith('_')}
DEFAULT_APP = next(k for k, v in CHANNELS.items() if v.get('default'))
APP = DEFAULT_APP  # this channel's row in the Inbox Channel config tab
ACCOUNTS = {}  # {platform: Social Media Publisher account} from post_to; '' or missing means the main account

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
DAILY_SLOT = '19:30'  # a channel's daily posting time when channels.json gives it no "time" or "times"


def daily_times(app):
    """A channel's daily posting times (IST, HH:MM): its "times" list, else its one "time", else DAILY_SLOT."""
    c = CHANNELS.get(app) or {}
    return sorted(c.get('times') or [c.get('time') or DAILY_SLOT])


def slot_unslotted(items):
    """Give every approved non-news video that has no slot the next free time of its channel's daily times (IST), and
    save it on the Inbox card, so it waits its turn like the rest instead of posting at the very next run."""
    todo = [i for i in items if when(i) is None and not is_news(i)]
    if not todo or POST_NOW or DRY:
        return
    taken = set()
    for st in ('approved', 'pending'):
        for i in inbox({'action': 'list', 'status': st, 'type': 'video', 'limit': 1000})['items']:
            if when(i) and mine(i):  # each channel fills its own times
                taken.add(when(i).astimezone(IST).replace(second=0, microsecond=0))
    times = [dt.time.fromisoformat(t) for t in daily_times(APP)]
    free = (dt.datetime.combine(dt.datetime.now(IST).date() + dt.timedelta(days=d), t, IST)
            for d in range(1, 3660) for t in times)  # empty times first, so a new video does not wait behind the queue
    for i in sorted(todo, key=lambda i: i.get('createdAt') or ''):
        at = next(f for f in free if f not in taken)
        i['slot'] = at.isoformat()
        try:
            fresh = inbox({'action': 'get', 'id': i['id']})['item']
            inbox({'action': 'update', 'id': i['id'], 'ifVersion': fresh['version'], 'set': {'slot': i['slot']}})
        except (RuntimeError, OSError, KeyError) as e:  # never let slotting stop a post; the next run tries again
            print(f"not slotted {i['id']}: {e}")
            continue
        print(f"slotted {i['id']} for {i['slot']}")


def item_app(i):
    """The channel a card posts to: its data.app, or the default channel for a card without one."""
    data = i.get('data') if isinstance(i.get('data'), dict) else {}
    return str(data.get('app') or '').strip() or DEFAULT_APP

def mine(i):
    """True for a card of the channel being posted now; serialized channels go through run_series instead."""
    return item_app(i) == APP and not series_name(i)

def is_news(i):
    return i.get('source') == 'news' or str(i['id']).startswith('news-')


def due_items():
    now = dt.datetime.now(dt.timezone.utc)
    if ITEM_ID:  # a manual run that names one video posts it now; a posted one gets its missing platforms
        items = inbox({'action': 'list', 'status': 'approved,posted', 'type': 'video', 'limit': 1000})['items']
        return [i for i in items if i['id'] == ITEM_ID and i.get('driveId') and mine(i)]
    # 1000 is the Inbox's largest page; the queue must never outgrow it, or videos past it are never posted.
    res = inbox({'action': 'list', 'status': 'approved', 'type': 'video', 'limit': 1000})
    if res.get('total', 0) > len(res['items']):
        print(f"WARNING: {res['total']} approved videos but only {len(res['items'])} read; the rest are skipped")
    items = [i for i in res['items'] if mine(i)]  # only this channel's cards; another app's video never posts here
    slot_unslotted([i for i in items if i.get('driveId')])
    # News goes out at the next run whatever its slot says: a story a day late has lost most of its reach.
    due = [i for i in items if i.get('driveId') and (POST_NOW or is_news(i) or when(i) is None or when(i) <= now)]
    return sorted(due, key=lambda i: (not is_news(i), when(i) or now))


# Platforms not posted to yet and why, shown on the Inbox card. Drop one here when it goes live in post_to (or PLATFORMS).
NOT_YET = {
    'linkedin': 'Page posting not approved yet',
}


def post_to():
    """{platform: account} from the Inbox Channel config (post_to), else from PLATFORMS with the main accounts.

    PLATFORMS is used only when post_to is empty or the Inbox is too old to have channelConfig. Any other error,
    or a post_to cell the Inbox can't read, stops the run: guessing could post to the wrong account."""
    try:
        cfg = inbox({'action': 'channelConfig'}).get('channels', {}).get(APP) or {}
    except RuntimeError as e:
        if 'unknown_action' not in str(e):
            raise
        print('this Inbox has no channelConfig yet; using PLATFORMS')
        cfg = {}
    if cfg.get('postToError'):
        raise RuntimeError(f"post_to for {APP} in the Inbox Channel config can't be read: {cfg['postToError']}")
    wanted = cfg.get('postTo') or {}
    if wanted:
        print(f"posting where the Inbox says: {', '.join(p + (':' + a if a else '') for p, a in wanted.items())}")
        return wanted
    if APP != DEFAULT_APP:  # PLATFORMS are the default channel's own accounts: another channel must never post there
        print(f'{APP} has no post_to in the Inbox Channel config, so it posts nowhere')
        return {}
    return {p.strip(): '' for p in os.environ.get('PLATFORMS', 'instagram,facebook,youtube').split(',') if p.strip()}


def live_platforms():
    wanted = post_to()
    ACCOUNTS.clear()
    ACCOUNTS.update({p: a for p, a in wanted.items() if a})
    live, down = [], {}
    for p in wanted:
        try:
            social(dict({'action': 'channel', 'platform': p}, **({'account': ACCOUNTS[p]} if p in ACCOUNTS else {})))
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


def shared_video(item, data, cache):
    """instagram_video, made once per run: Instagram and Threads fetch the same public copy."""
    if 'shared' not in cache:
        cache['shared'] = instagram_video(item, data)
    return cache['shared']


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
    follow = CHANNELS[APP].get('follow') or ''
    return '\n'.join([(item.get('title') or '').strip()] + [l for l in lines if l] + ([follow] if follow else [])).strip()


PLATFORMS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'platforms')


def limit(platform, name):
    """A text limit from platforms/<platform>.json (the numbers Social Media Publisher enforces)."""
    return json.load(open(os.path.join(PLATFORMS_DIR, f'{platform}.json')))[name]


def fit(text, most, what, unit='chars'):
    """Last resort for text a build wrote too long: cut at the last line break that fits, and say so.
    YouTube counts descriptions in UTF-8 bytes (Telugu takes 3 a letter), so unit='bytes' measures those."""
    # 'chars' counts as Social Media Publisher does (JavaScript length: an emoji is 2), so a cut text always passes;
    # 'threads' counts as Threads does (an emoji is its UTF-8 bytes)
    size = {'bytes': lambda t: len(t.encode()), 'threads': threads_len}.get(unit, lambda t: len(t.encode('utf-16-le')) // 2)
    if size(text) <= most:
        return text
    cut = text
    while size(cut) > most:
        cut = cut[:cut.rfind('\n')] if '\n' in cut else cut[:-1]
    print(f"WARNING: {what} was {size(text)} {unit}, over the limit of {most}; cut to {size(cut)}. Fix the build's text.")
    return cut.rstrip()


def cross_link(description, line):
    """Adds a channel's crossLink line (a pointer to its sister channel) to a YouTube description when it is not
    there yet and still fits; a description that is already full stays as it is."""
    if not line or line in description:
        return description
    out = f"{description}\n\n{line}" if description else line
    return out if len(out.encode()) <= limit('youtube', 'descriptionMaxBytes') else description


def threads_len(t):
    """Threads' length: an emoji counts as its UTF-8 bytes, every other character as one (as Social Media Publisher counts)."""
    # The same ranges as THREADS_EMOJI in Social Media Publisher's src/threads.js
    ranges = ((0x1F000, 0x1FAFF), (0x2190, 0x21FF), (0x2300, 0x23FF), (0x2600, 0x27BF), (0x2900, 0x297F), (0x2B00, 0x2BFF))
    single = (0x203C, 0x2049, 0x2122, 0x2139, 0x20E3, 0x3030, 0x303D, 0x3297, 0x3299, 0xFE0F, 0x200D)
    emoji = lambda c: c in single or any(lo <= c <= hi for lo, hi in ranges)
    return sum(len(ch.encode()) if emoji(ord(ch)) else 1 for ch in t)


def cap_hashtags(text, most, what):
    """Keeps the first `most` hashtags and drops the rest (Instagram refuses more than 5 since Dec 2025)."""
    tags = re.findall(r'(?<!\S)#[^\s#]+', text)
    if len(tags) <= most:
        return text
    drop = set(range(most, len(tags)))
    n = [-1]
    def keep(m):
        n[0] += 1
        return '' if n[0] in drop else m.group(0)
    out = re.sub(r'[ \t]*(?<!\S)#[^\s#]+', keep, text).rstrip()
    print(f"WARNING: {what} had {len(tags)} hashtags, over the limit of {most}; kept the first {most}. Fix the build's text.")
    return out


def first_comment(platform, data):
    """The channel's own first comment under the post: the card's data.pin question. None when there is none, or on
    Instagram when it holds a hashtag (Social Media Publisher refuses the whole post then, by the same test:
    Instagram counts those with the caption toward its limit of 5)."""
    pin = (data.get('pin') or '').strip() if isinstance(data.get('pin'), str) else ''
    if not pin or (platform == 'instagram' and re.search(r'(?<!\S)#[^\s#]+', pin)):
        return None
    return fit(pin, 2000, f'{platform} first comment')


def playlist_for(item, data):
    """The YouTube playlist a video joins: the card's data.playlist, else the channel's playlist for its kind
    (channels.json youtube.playlists: {"news": ..., "default": ...}). None for a channel without playlists."""
    lists = (CHANNELS[APP].get('youtube') or {}).get('playlists') or {}
    if isinstance(data.get('playlist'), str) and data['playlist'].strip():
        return data['playlist'].strip()
    return lists.get('news' if is_news(item) else data.get('kind')) or lists.get('default')


def post_for(platform, item, data, cache):
    # data.meta.<platform> (written by the build from platforms/<platform>.json "metadata") wins over the shared yt/ig text
    meta = ((data.get('meta') or {}).get(platform) or {}) if isinstance(data.get('meta'), dict) else {}
    title = (meta.get('title') or data.get('yt') or item.get('title') or '').strip()
    caption = (meta.get('text') or data.get('ig') or fallback_text(item, data)).strip()
    file_id = platform_file(platform, item, data, cache)
    key = f"{item['id']}-{platform}" + ('-version' if file_id != item['driveId'] else '')  # its own job
    if ACCOUNTS.get(platform):  # another account is another post: never reuse the main channel's job
        key += f"-{ACCOUNTS[platform]}"
    video = {'driveFileId': file_id}
    if platform == 'instagram' and file_id == item['driveId']:
        key = f"{item['id']}-instagram-link" + (f"-{ACCOUNTS['instagram']}" if ACCOUNTS.get('instagram') else '')
        if not job_exists(key):  # a job from an earlier run carries on with the video it has
            video = shared_video(item, data, cache)
    if platform == 'instagram':
        caption = fit(cap_hashtags(caption, limit('instagram', 'hashtagsMax'), f"{item['id']} Instagram caption"),
                      limit('instagram', 'captionMax'), f"{item['id']} Instagram caption")
        post = {'platform': platform, 'key': key, 'video': video, 'caption': caption}
        cover = None if job_exists(key) else instagram_cover(item, data)
        if cover:
            post['coverUrl'] = cover
        if first_comment(platform, data):  # a refused comment is only a warning on the job
            post['firstComment'] = first_comment(platform, data)
        if CHANNELS[APP].get('collaborators'):  # Collab invites to our sister account (it accepts in the app)
            post['collaborators'] = CHANNELS[APP]['collaborators']
        return post
    if platform == 'facebook':
        post = {'platform': platform, 'key': key, 'video': video, 'title': fit(title.replace('#shorts', '').strip(), limit('facebook', 'titleMax'), f"{item['id']} Facebook title"),
                'description': fit(caption, limit('facebook', 'captionMax'), f"{item['id']} Facebook description")}
        if data.get('thumb'):  # the Reel's cover; a refused one is only a warning on the job
            post['thumbnail'] = {'driveFileId': data['thumb']}
        return post
    if platform == 'threads':
        if file_id != item['driveId']:
            raise ValueError('Threads takes only the full video, from the public link')
        # A job from an earlier run carries on with its own video; the link here only has to pass the check.
        link = (f"https://github.com/{os.environ.get('GITHUB_REPOSITORY', 'x/x')}/releases/download/{IG_RELEASE}/{item['id']}-instagram.mp4"
                if job_exists(key) else shared_video(item, data, cache).get('url'))
        if not link:
            raise ValueError('no public link for Threads (needs GITHUB_TOKEN)')
        what = f"{item['id']} Threads text"
        text = fit(cap_hashtags(caption, limit('threads', 'hashtagsMax'), what), limit('threads', 'captionMax'), what, 'threads')
        return {'platform': platform, 'key': key, 'video': {'url': link}, 'text': text}
    if platform == 'linkedin':
        text = '\n'.join(l for l in caption.splitlines() if not l.startswith('Follow @'))
        return {'platform': platform, 'key': key, 'video': video, 'text': text[:3000]}
    if platform == 'youtube':
        yt = CHANNELS[APP].get('youtube') or {}
        post = {'platform': platform, 'key': key, 'video': video, 'title': fit(title, limit('youtube', 'titleMax'), f"{item['id']} YouTube title"),
                'description': cross_link(fit(caption, limit('youtube', 'descriptionMaxBytes'), f"{item['id']} YouTube description", 'bytes'),
                                          yt.get('crossLink')),
                'privacy': 'public', 'categoryId': yt.get('categoryId', 28), 'madeForKids': bool(yt.get('madeForKids', False))}
        for k in ('tags', 'language'):  # optional per-channel defaults, e.g. Chinni Slokalu's tags and Telugu audio
            if yt.get(k):
                post[k] = yt[k]
        if data.get('thumb'):  # custom thumbnail (pipeline2/thumb.mjs); a refused one is only a warning on the job
            post['thumbnail'] = {'driveFileId': data['thumb']}
        if first_comment(platform, data):  # the video goes up public, so it can take a comment at once
            post['firstComment'] = first_comment(platform, data)
        if playlist_for(item, data):  # Social Media Publisher makes it on first use; a failure is only a warning
            post['playlists'] = [playlist_for(item, data)]
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
            'title': fit(meta.get('title') or item.get('title') or '', limit('youtube', 'titleMax'), f"{item['id']} YouTube title"),
            'description': cross_link(fit(meta.get('text') or fallback_text(item, data), limit('youtube', 'descriptionMaxBytes'),
                                          f"{item['id']} YouTube description", 'bytes'), cfg.get('crossLink')),
            'privacy': 'private', 'publishAt': at.isoformat(), 'categoryId': cfg['categoryId'],
            'language': cfg['language'], 'aiGenerated': cfg['aiGenerated'], 'madeForKids': False}
    if data.get('thumb'):
        post['thumbnail'] = {'driveFileId': data['thumb']}
    if cfg.get('playlist'):  # Social Media Publisher makes it on first use; a failure is only a warning
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


IG_SERIES_WAIT = 5 * 60  # keeps the whole run inside the workflow's 60 minutes
IG_SERIES = {k: v for k, v in RULES.get('instagram', {}).get('channels', {}).items() if not k.startswith('_')}


def ig_series_caption(item, data, cfg):
    """An episode's Instagram caption: data.meta.instagram.text, else its YouTube title and description, then the
    channel's follow line. Hashtags beyond Instagram's limit are cut (with a warning), never the story."""
    meta = (data.get('meta') or {}) if isinstance(data.get('meta'), dict) else {}
    ig, yt = meta.get('instagram') or {}, meta.get('youtube') or {}
    if ig.get('text'):
        text = ig['text'].strip()
    else:
        title = re.sub(r'\s*#shorts\b', '', yt.get('title') or item.get('title') or '', flags=re.I).strip()
        body = '\n'.join(l for l in (yt.get('text') or '').splitlines() if 'http' not in l)  # links don't open on Instagram
        text = '\n\n'.join(t for t in (title, body.strip()) if t)
    if cfg.get('follow') and cfg['follow'] not in text:
        text += '\n\n' + cfg['follow']
    what = f"{item['id']} Instagram caption"
    return fit(cap_hashtags(text, limit('instagram', 'hashtagsMax'), what), limit('instagram', 'captionMax'), what)


def ig_series_due(posts, cfg, now):
    """True when a new Instagram post is due: the latest of the channel's timesIST that has passed is later than
    its last Instagram post (posts: the datetimes of earlier ones)."""
    ist_now = now.astimezone(IST)
    slots = [dt.datetime.combine(ist_now.date() - dt.timedelta(days=d), dt.time.fromisoformat(t), IST)
             for d in (0, 1) for t in cfg['timesIST']]
    slot = max(s for s in slots if s <= ist_now)
    return not posts or max(posts) < slot


def ig_series_ready(item, now):
    d = item.get('data') or {}
    return bool(item.get('driveId') and d.get('publishAt') and dt.datetime.fromisoformat(d['publishAt']) <= now)


def ig_series_next(items, now, name):
    """The episode Instagram posts next. Each group numbers its own episodes, so each group's head is its lowest
    episode not on Instagram yet, ready or not: a group never skips ahead, even after a failure. Of the heads that
    are live on YouTube, the earliest goes first. Returns it (or a waiting head, or None) and every ready episode."""
    left = [i for i in items if not (((i.get('data') or {}).get('posted') or {}).get('instagram'))
            and group_of(i, name) is not None]
    if not left:
        return None, []
    far = dt.datetime.max.replace(tzinfo=dt.timezone.utc)
    at = lambda i: dt.datetime.fromisoformat(i['data']['publishAt']) if (i.get('data') or {}).get('publishAt') else far
    heads = {}
    for i in left:
        g, k = group_of(i, name), (episode_of(i) if episode_of(i) is not None else 10 ** 9, at(i))
        if g not in heads or k < heads[g][0]:
            heads[g] = (k, i)
    heads = [i for _, i in heads.values()]
    ready = [i for i in heads if ig_series_ready(i, now)]
    return min(ready or heads, key=at), [i for i in left if ig_series_ready(i, now)]


def run_ig_series(name):
    """Posts the oldest episode of a serialized channel that is live on YouTube but not yet on Instagram, when one of
    the channel's Instagram times has passed since its last Instagram post. Returns 1 on a failed post."""
    cfg = IG_SERIES[name]
    now = dt.datetime.now(dt.timezone.utc)
    every = [i for i in inbox({'action': 'list', 'status': 'posted', 'type': 'video', 'limit': 1000})['items']
             if series_name(i) == name]
    done = [dt.datetime.fromisoformat(i['data']['igPostedAt']) for i in every if (i.get('data') or {}).get('igPostedAt')]
    item, live = ig_series_next(every, now, name)
    if not item:
        print(f'{name} instagram: nothing new on YouTube to post')
        return 0
    if not ig_series_ready(item, now):  # strict order: a later episode never goes out before this one
        print(f"{name} instagram: next episodes are not live on YouTube yet (first: {item['id']}); later ones wait")
        return 0
    if not ig_series_due(done, cfg, now):
        print(f"{name} instagram: next is {item['id']}, waiting for the next of {', '.join(cfg['timesIST'])} IST")
        return 0
    try:
        social({'action': 'channel', 'platform': 'instagram', 'account': cfg['account']})
    except RuntimeError as e:  # not connected yet is a setup step, not a failed run
        print(f"{name} instagram: account {cfg['account']} not usable ({e}); {len(live)} episodes wait")
        return 0
    data = dict(item['data'])
    key = f"{item['id']}-instagram-link-{cfg['account']}"
    print(f"{name} instagram: posting {item['id']} to account {cfg['account']}; {len(live) - 1} more waiting")
    if DRY:
        print(ig_series_caption(item, data, cfg))
        return 0
    post = {'action': 'publish', 'platform': 'instagram', 'account': cfg['account'], 'key': key,
            'caption': ig_series_caption(item, data, cfg)}
    if cfg.get('collaborators'):  # Collab invites to our sister account (it accepts in the app)
        post['collaborators'] = cfg['collaborators']
    if job_exists(key):  # a job from an earlier run carries on with the video it has
        post['video'] = {'driveFileId': data.get('igDriveId') or item['driveId']}
    else:
        post['video'] = instagram_video(item, data)
        cover = instagram_cover(item, data)
        if cover:
            post['coverUrl'] = cover
    job = social(post)['job']
    deadline = time.time() + IG_SERIES_WAIT  # a job still running is picked up by the next run, under the same key
    while job['status'] in ('queued', 'running') and time.time() < deadline:
        time.sleep(20)
        job = social({'action': 'get', 'id': job['id']})['job']
    fresh = inbox({'action': 'get', 'id': item['id']})['item']
    data = dict(fresh['data'], **({'igDriveId': data['igDriveId']} if data.get('igDriveId') else {}))
    if job['status'] == 'done':
        remove_public_link(f"{item['id']}-instagram.mp4")
        url = (job.get('result') or {}).get('url')
        inbox({'action': 'update', 'id': item['id'], 'ifVersion': fresh['version'], 'set': {
            'data': dict(data, posted=dict(data.get('posted') or {}, instagram=url), igPostedAt=now.isoformat())}})
        print(f'{name} instagram: posted {url}')
        return 0
    fails = int(data.get('igFails', 0)) + (job['status'] == 'failed')
    inbox({'action': 'update', 'id': item['id'], 'ifVersion': fresh['version'], 'set': {
        'data': dict(data, igFails=fails), 'note': f"Publisher: Instagram {job['status']}: {job.get('error') or 'still running'}"}})
    if fails >= MAX_RUNS:
        alert(f"alert-{item['id']}-instagram-{fails}", f"{name}: episode {episode_of(item)} will not post on Instagram",
              f"Instagram failed {fails} runs in a row: {job.get('error')}. Later episodes wait until it goes out.")
    if job['status'] == 'failed' and job.get('id'):
        social({'action': 'retry', 'id': job['id']})
    return 1 if job['status'] == 'failed' else 0


LATE_HOURS = 3  # a video still unposted this long after its slot means publish runs were missed


def alert(alert_id, title, summary):
    """A to-do in the Inbox, which Telegram sends as a message. The fixed id makes each alert go out once."""
    try:
        inbox({'action': 'add', 'id': alert_id, 'type': 'todo', 'status': 'pending', 'title': title, 'summary': summary,
               'data': {'app': APP, 'icon': '🚨'}})
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
        for name in IG_SERIES:
            try:
                series_failed |= run_ig_series(name)
            except (RuntimeError, OSError, KeyError, ValueError, TypeError) as e:  # never let it stop another channel's post
                print(f'{name} instagram: {e}')
                series_failed = 1
    failed = series_failed
    for app in CHANNELS:
        try:
            failed |= run_channel(app)
        except (RuntimeError, OSError, KeyError, ValueError) as e:  # one channel's problem never stops another's post
            print(f'{app}: {e}')
            failed = 1
    return failed

def run_channel(app):
    """Posts the next due video of one channel to every platform in its post_to. 1 if a platform failed."""
    global APP
    APP = app
    print(f'--- {app}')
    items = due_items()
    if not items:
        print('nothing due')
        return 0
    if not ITEM_ID:
        late_alert(items)
    item = items[0]
    data = dict(item.get('data')) if isinstance(item.get('data'), dict) else {}
    platforms, down = live_platforms()
    print(f"posting {item['id']} (slot {item.get('slot')}) to {', '.join(platforms) or 'nothing'}; {len(items) - 1} more due")
    if DRY or not platforms:
        return 0 if platforms or not down else 1  # no post_to at all is a setup step, not a failure

    # A platform whose channel is down counts as a failed post, so the video stays approved and the
    # next run tries it again instead of marking it posted without that platform.
    jobs = {p: {'id': None, 'status': 'failed', 'error': e} for p, e in down.items()}
    cache, no_version = {}, {}
    for p in platforms:
        if any(k.lower() == p and u for k, u in (data.get('posted') or {}).items()):  # "+ Posted" by hand writes "YouTube"
            continue  # already there: never post a platform twice, whatever key its job had
        try:
            if platform_file(p, item, data, cache) is None:
                no_version[p] = f"needs its own {p} version of {RULES[p]['versionSeconds']} s or less (the video build makes it)"
                print(f'skip {p}: {no_version[p]}')
                continue
            body = dict(post_for(p, item, data, cache), action='publish')
            if p in ACCOUNTS:
                body['account'] = ACCOUNTS[p]
            jobs[p] = social(body)['job']
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

    # Instagram and Threads fetch the same copy: remove it once every one of them that posted this run is up.
    fetchers = [jobs[p] for p in ('instagram', 'threads') if p in jobs and jobs[p].get('id')]  # a platform that never started fetches nothing
    if fetchers and all(j['status'] == 'done' for j in fetchers) and os.environ.get('GITHUB_TOKEN'):
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
    later = {p: why for p, why in dict(NOT_YET if APP == DEFAULT_APP else {}, **no_version).items() if p not in posted and p not in still_failed}
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
