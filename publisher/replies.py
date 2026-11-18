#!/usr/bin/env python3
"""Comment replies for How To Hero, approved one by one in the Inbox.

Runs at the start of every publish run (see .github/workflows/publish.yml), in two steps:

1. Posts approved replies. Each Inbox item of type "reply" that is approved goes out through Social Manager,
   then is marked "posted". If the user wrote a note when approving, the note is posted instead of the draft,
   so a reply can be edited on the way. Social Manager returns the first reply when the same text is sent
   to the same comment again, so a rerun never posts twice.
2. Pulls new comments. Each viewer comment from the last MAX_AGE_DAYS that the channel hasn't answered becomes
   a "reply" item in status "building" (no Telegram message yet). The scout and build runs draft the answer
   (SKILL.md "Comment replies") and set it "pending", which sends it to Telegram for approval.

Needs INBOX_URL, INBOX_TOKEN, SOCIAL_URL and SOCIAL_TOKEN. YouTube only for now.
"""
import datetime as dt
import sys

from publish import inbox, social, DRY

MAX_AGE_DAYS = 14


def post_approved():
    failed = 0
    for it in inbox({'action': 'list', 'type': 'reply', 'status': 'approved', 'limit': 100})['items']:
        d = it.get('data') if isinstance(it.get('data'), dict) else {}
        text = (it.get('note') or '').strip() or (d.get('reply') or '').strip()
        if not text or not d.get('commentId'):
            print(f"skip {it['id']}: no reply text or comment id")
            continue
        print(f"reply to {it['id']}: {text[:80]}")
        if DRY:
            continue
        try:
            r = social({'action': 'reply', 'platform': d.get('platform', 'youtube'), 'commentId': d['commentId'], 'text': text})['reply']
        except (RuntimeError, OSError) as e:
            failed += 1
            print(f"  FAILED: {e}")
            inbox({'action': 'update', 'id': it['id'], 'set': {'data': dict(d, error=str(e)[:500])}})
            continue
        inbox({'action': 'update', 'id': it['id'], 'set': {
            'status': 'posted', 'data': dict(d, posted={'text': text, 'replyId': r['id'], 'at': dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')}, error=None)}})
    return failed


def pull_new():
    since = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=MAX_AGE_DAYS)
    added = 0
    for c in social({'action': 'comments', 'platform': 'youtube', 'limit': 50})['comments']:
        if c['replied'] or dt.datetime.fromisoformat(c['at'].replace('Z', '+00:00')) < since:
            continue
        item = {'action': 'add', 'id': f"reply-yt-{c['id']}", 'type': 'reply', 'status': 'building',
                'title': f"Reply to {c['author']} on \"{c['videoTitle']}\""[:200], 'summary': c['text'][:3000], 'link': c['url'],
                'data': {'app': 'How To Hero', 'icon': '🦸', 'platform': 'youtube', 'commentId': c['id'], 'author': c['author'],
                         'comment': c['text'], 'videoId': c['videoId'], 'videoTitle': c['videoTitle'], 'url': c['url'], 'at': c['at']}}
        if DRY:
            print(f"new comment {c['id']}: {c['text'][:80]}")
            continue
        try:
            inbox(item)
            added += 1
        except RuntimeError as e:
            if 'conflict' not in str(e):  # already in the Inbox
                raise
    print(f'{added} new comment(s) waiting for a draft')


if __name__ == '__main__':
    bad = post_approved()
    pull_new()
    sys.exit(1 if bad else 0)
