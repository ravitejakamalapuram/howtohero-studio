# howtohero-studio

How To Hero video pipeline: the `how-to-hero-video` skill (`.claude/skills/how-to-hero-video`) and the auto-publisher (`publisher/publish.py`).

## How it runs

1. **Ideas and approvals live in the Inbox** (repo `inbox`, a Google Sheet + API + Telegram buttons). The user approves ideas and finished videos on Telegram.
2. **Daily scout** (scheduled task) follows `SCOUT.md`: it proposes news `story` cards first (3-10 a day, ranked by virality), then explainer `idea` cards. It builds nothing, so it is cheap. The user approves or rejects each card on Telegram.
3. **Daily build run** (scheduled task, after the user's morning approvals) follows `SKILL.md` "Build run": it claims approved cards (news first, trending news before science), builds up to 10 videos one at a time, uploads each to the Inbox and sets it `pending` for review. The claim marks the card `building` first, so two runs never build the same one, and a card left by a crashed run is picked up again once its 3-hour claim expires.
4. **Auto-publisher** (GitHub Action `.github/workflows/publish.yml`, 3 times a day at about 08:30, 13:00 and 19:30 IST, or run it by hand) runs `publisher/publish.py`: it posts the first approved video whose `slot` has passed (news first; an empty slot counts as due) through Social Manager (repo `social-manager`) and marks it `posted`. One video per run, so 3 a day. Its tokens are repo secrets.

Platforms: Instagram and Facebook post live. YouTube waits for Google's API audit (until then uploads would stay private), and LinkedIn is parked; the publisher never posts to a personal profile.

The old How To Hero artifact queue is retired. Its unposted cards moved to the Inbox on 2026-11-15.

## Layout

- `SETUP.md`: every key the jobs use, where it lives, and how to run a job on another AI platform.
- `.claude/skills/how-to-hero-video/SCOUT.md`: the daily scout (proposes news and ideas).
- `.claude/skills/how-to-hero-video/SKILL.md`: the build run and the video rules.
- `.claude/skills/how-to-hero-video/NEWS.md`: how to find, source and build news stories.
- `.claude/skills/how-to-hero-video/config.json`: the daily numbers (news per day, ideas per day, videos per build run, claim time).
- `.claude/skills/how-to-hero-video/inbox.sh`: the only way the jobs call the Inbox.
- `.claude/skills/how-to-hero-video/dupcheck.py`: checks a topic against every Inbox item before a job builds or proposes it, so no video is made twice.
- `.claude/skills/how-to-hero-video/pipeline/`: HyperFrames + Kokoro TTS + ffmpeg renderer, `verify.py`, and worked examples in `videos/` (`v*` shorts, `n*` news, `d*` 16:9 documentaries).
- `publisher/publish.py`: the auto-publisher.

Tokens and URLs come from the scheduled tasks' prompts or environment. Never commit them.
