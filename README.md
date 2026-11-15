# howtohero-studio

How To Hero video pipeline: the `how-to-hero-video` skill (`.claude/skills/how-to-hero-video`) and the auto-publisher (`publisher/publish.py`).

## How it runs

1. **Ideas and approvals live in the Inbox** (repo `inbox`, a Google Sheet + API + Telegram buttons). The user approves ideas and finished videos on Telegram.
2. **Nightly worker B** (scheduled task, 00:03 IST) claims approved ideas, builds one video at a time with `SKILL.md`, uploads it to the Inbox and sets it `pending` for review.
3. **Daily news explainer** (scheduled task, 05:47 IST) follows `NEWS.md`: trending tech stories are built at once, science stories are proposed as `story` items first.
4. **Auto-publisher** (GitHub Action `.github/workflows/publish.yml`, every 2 hours, or run it by hand) runs `publisher/publish.py`: it posts the first approved video whose `slot` has passed (news first; an empty slot counts as due) through Social Manager (repo `social-manager`) and marks it `posted`. One video per run. Its tokens are repo secrets.

Platforms: Instagram and Facebook post live. YouTube waits for Google's API audit (until then uploads would stay private), and LinkedIn is parked; the publisher never posts to a personal profile.

The old How To Hero artifact queue is retired. Its unposted cards moved to the Inbox on 2026-11-15.

## Layout

- `.claude/skills/how-to-hero-video/SKILL.md`: the nightly build procedure and the video rules.
- `.claude/skills/how-to-hero-video/NEWS.md`: the daily news procedure.
- `.claude/skills/how-to-hero-video/inbox.sh`: the only way the jobs call the Inbox.
- `.claude/skills/how-to-hero-video/pipeline/`: HyperFrames + Kokoro TTS + ffmpeg renderer, `verify.py`, and worked examples in `videos/` (`v*` shorts, `n*` news, `d*` 16:9 documentaries).
- `publisher/publish.py`: the auto-publisher.

Tokens and URLs come from the scheduled tasks' prompts or environment. Never commit them.
