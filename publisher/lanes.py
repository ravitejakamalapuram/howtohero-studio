"""The publishing plan: which card each platform of each series posts at this publish run (publisher/series.json).

Pure functions, no network: plan() takes the Inbox cards, the time and the post_to accounts and returns the posts
to make. Every (series, platform) pair is a lane with its own pointer, the oldest card that platform does not have
yet. A lane posts at most one card per run, and only when one of its slots is due (a slot is due for an hour after
its time, like the Inbox timer that starts the runs).

order strict (a story series): every lane posts in episode order. The lead posts the next approved episode at its
slots; any other lane posts the next episode only once it is live on the lead, at its slots, and also at its
catchUpSlots while it is behind the lead. A missing episode holds every later one.
order loose (standalone videos): at its slots a lane posts the first due approved card it does not have (news first,
then by slot), so a new video goes to every platform in the same run. A card that is already out (status posted)
but missing on a platform goes there only at that platform's catchUpSlots, oldest first, if it went out on or after
since. No catchUpSlots means missed cards are skipped.
"""
import datetime as dt
import json
import os

IST = dt.timezone(dt.timedelta(hours=5, minutes=30))
DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
DUE_FOR = dt.timedelta(hours=1)  # a slot is due this long after its time, as in the Inbox's duePublishSlot
LANE_KEYS = ('account', 'slots', 'catchUpSlots', 'everyDays', 'since')
PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'series.json')


def load(path=PATH):
    with open(path) as fh:
        cfg = json.load(fh)
    check(cfg)
    return cfg


def check(cfg):
    """Raises ValueError for a plan that can't work: a bad slot time, or a series naming a slot that does not exist."""
    for name, t in cfg['slots'].items():
        times = t.values() if isinstance(t, dict) else [t]
        if isinstance(t, dict) and sorted(t) != sorted(DAYS):
            raise ValueError(f'slot {name} must give a time for every day: {", ".join(DAYS)}')
        for hm in times:
            dt.time.fromisoformat(hm)
    for sname, s in cfg['series'].items():
        if s.get('order') not in ('strict', 'loose'):
            raise ValueError(f'{sname}: order must be strict or loose')
        lanes = [s] + (list(s['platforms'].values()) if isinstance(s.get('platforms'), dict) else [])
        for lane in lanes:
            for slot in (lane.get('slots') or []) + (lane.get('catchUpSlots') or []):
                if slot not in cfg['slots']:
                    raise ValueError(f'{sname}: unknown slot {slot}')


def slot_at(cfg, name, day):
    """The datetime (IST) of slot `name` on date `day`."""
    t = cfg['slots'][name]
    hm = t[DAYS[day.weekday()]] if isinstance(t, dict) else t
    return dt.datetime.combine(day, dt.time.fromisoformat(hm), IST)


def due_slots(cfg, now):
    """{slot name: its time} for every slot whose time passed within the last hour."""
    out = {}
    for d in (0, 1):  # a slot just before midnight is still due just after it
        day = now.astimezone(IST).date() - dt.timedelta(days=d)
        for name in cfg['slots']:
            at = slot_at(cfg, name, day)
            if at <= now < at + DUE_FOR:
                out[name] = at
    return out


def parse(s):
    try:
        out = dt.datetime.fromisoformat(str(s).replace('Z', '+00:00'))
    except (TypeError, ValueError):
        return None
    return out if out.tzinfo else out.replace(tzinfo=IST)


def data_of(item):
    return item.get('data') if isinstance(item.get('data'), dict) else {}


def episode(item):
    try:
        return int(data_of(item).get('episode'))
    except (TypeError, ValueError):
        return None


def is_news(item):
    return item.get('source') == 'news' or str(item.get('id', '')).startswith('news-')


def has(item, platform):
    """True when the card is on this platform: data.posted has a link for it (a hand-added "YouTube" counts too)."""
    return any(k.lower() == platform and v for k, v in (data_of(item).get('posted') or {}).items())


def posted_at(item, platform):
    """When the card went out on this platform, or None: data.postedTimes, else the older per-path fields."""
    d = data_of(item)
    for v in ((d.get('postedTimes') or {}).get(platform),
              d.get('igPostedAt') if platform == 'instagram' else None,
              d.get('publishAt') if platform == 'youtube' else None,
              d.get('postedAt')):
        if v and parse(v):
            return parse(v)
    return None


def members(series, items, default_app):
    """The series' cards: by data.channel and data.group for a serialized channel, else by data.app."""
    out = []
    for i in items:
        d = data_of(i)
        channel = str(d.get('channel') or '').strip().lower()
        if series.get('channel'):
            group = str(d.get('group') or '').strip().lower() or (series['group'] if series.get('defaultGroup') else '')
            if channel == series['channel'] and group == series['group']:
                out.append(i)
        elif not channel and (str(d.get('app') or '').strip() or default_app) == series['app']:
            out.append(i)
    return out


def lanes_of(series, post_to):
    """{platform: lane settings}: the series defaults, overridden per platform. post_to is {platform: account}."""
    base = {k: series[k] for k in LANE_KEYS if k in series}
    if series.get('platforms') == 'post_to':
        return {p: dict(base, **({'account': a} if a else {})) for p, a in (post_to or {}).items()}
    return {p: dict(base, **v) for p, v in series['platforms'].items()}


def lane_open(lane, cards, platform, slots, due):
    """The due slots this lane may use now ({name: time}), or {} when it has posted since then (or too recently)."""
    mine = {n: due[n] for n in slots if n in due}
    if not mine:
        return {}
    times = [t for t in (posted_at(i, platform) for i in cards if has(i, platform)) if t]
    last, start = max(times, default=None), min(mine.values())
    if last is None:
        return mine
    if lane.get('everyDays'):
        return mine if start - last >= dt.timedelta(days=lane['everyDays']) - dt.timedelta(hours=2) else {}
    return mine if last < start else {}


def strict_next(series, cards, platform, lead, now):
    """The next episode for this lane and whether it may go now: lowest episode it lacks; on a non-lead lane it must
    be live on the lead (on it, and past its YouTube publish time if it has one)."""
    after = int(series.get('after') or 0)
    on_lead = lambda i: has(i, lead) or (episode(i) or 0) <= after
    numbered = {episode(i): i for i in sorted(cards, key=lambda i: i.get('status') != 'approved') if episode(i)}
    done = lambda i: has(i, platform) or (platform == lead and on_lead(i))
    n = 1  # the next episode number: never skip one, except an early one posted by hand that has no card (<= after)
    while (n in numbered and done(numbered[n])) or (n not in numbered and n <= after):
        n += 1
    if n not in numbered:
        return None, f'episode {n} has no card yet' if any(e > n for e in numbered) else 'nothing left'
    head = numbered[n]
    todo = [i for e, i in numbered.items() if e >= n and not done(i)]
    if not head.get('driveId'):
        return None, f"episode {episode(head)} has no video yet"
    if platform == lead:
        return (head, 'next episode') if head.get('status') == 'approved' else (None, f'episode {episode(head)} not approved yet')
    at = parse(data_of(head).get('publishAt'))
    if not on_lead(head) or (at and at > now):
        return None, f'episode {episode(head)} not live on {lead} yet'
    behind = sum(1 for i in todo if on_lead(i))
    return head, f'next episode ({behind} behind {lead})'


def loose_new(cards, platform, now):
    due = [i for i in cards if i.get('status') == 'approved' and i.get('driveId') and not has(i, platform)
           and (is_news(i) or parse(i.get('slot')) is None or parse(i.get('slot')) <= now)]
    return sorted(due, key=lambda i: (not is_news(i), parse(i.get('slot')) or now, i.get('createdAt') or ''))


def loose_missed(lane, cards, platform, lead):
    """Cards already out (status posted) that this platform lacks, oldest first, from lane since."""
    since = parse(lane['since']) if lane.get('since') else None
    out = []
    for i in cards:
        if i.get('status') != 'posted' or has(i, platform) or not i.get('driveId'):
            continue
        at = posted_at(i, lead) or posted_at(i, platform)
        if since and (at is None or at < since):
            continue
        out.append((at or since or dt.datetime.min.replace(tzinfo=dt.timezone.utc), i))
    return [i for _, i in sorted(out, key=lambda x: x[0])]


def plan(cfg, items, now, post_to, default_app):
    """The posts to make at this run: [{series, platform, account, id, title, why}], plus one line per lane that
    waits ({..., id: None, why}). post_to is {app: {platform: account}} from the Inbox Channel config."""
    due = due_slots(cfg, now)
    out = []
    for sname, s in cfg['series'].items():
        cards = members(s, items, default_app)
        for p, lane in lanes_of(s, (post_to or {}).get(s.get('app'))).items():
            row = {'series': sname, 'platform': p, 'account': lane.get('account', ''), 'id': None}
            normal = lane_open(lane, cards, p, lane.get('slots') or [], due)
            catch = lane_open(lane, cards, p, lane.get('catchUpSlots') or [], due)
            if not normal and not catch:
                continue  # not this lane's time
            if s['order'] == 'strict':
                item, why = strict_next(s, cards, p, s['lead'], now)
                if item and not normal and p == s['lead']:
                    item, why = None, 'the lead keeps its own pace'
            else:
                new = loose_new(cards, p, now) if normal else []
                missed = loose_missed(lane, cards, p, s['lead']) if catch and p != s['lead'] else []
                late = loose_new(cards, p, now) if catch and p == s['lead'] else []
                if new:
                    item, why = new[0], ('news' if is_news(new[0]) else 'new') + f' ({len(new) - 1} more due)'
                elif missed:
                    item, why = missed[0], f'catch-up ({len(missed) - 1} more missed)'
                elif late:
                    item, why = late[0], f'catch-up ({len(late) - 1} more due)'
                else:
                    item, why = None, 'nothing due'
            slot = ', '.join(sorted(normal or catch))
            out.append(dict(row, id=item and item['id'], title=item and item.get('title'), why=f'{slot}: {why}'))
    return out
