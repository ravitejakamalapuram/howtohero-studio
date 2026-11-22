# howtohero-studio

How To Hero video pipeline: the `how-to-hero-video` skill (`.claude/skills/how-to-hero-video`) and the auto-publisher (`publisher/publish.py`).

## How it runs

1. **Ideas and approvals live in the Inbox** (repo `inbox`, a Google Sheet + API + Telegram buttons). The user approves ideas and finished videos on Telegram.
2. **Daily scout** (scheduled task) follows `SCOUT.md`: it proposes news `story` cards first (3-10 a day, ranked by virality), then `idea` cards of every kind (explainers, quick facts, curiosity stories, the odd documentary) by the rules in `IDEAS.md`. It builds nothing, so it is cheap. The user approves or rejects each card on Telegram.
3. **Daily build run** (scheduled task, after the user's morning approvals) follows `SKILL.md` "Build run": it claims approved cards (news first, trending news before science), builds up to 10 videos one at a time, uploads each to the Inbox and sets it `pending` for review. The claim marks the card `building` first, so two runs never build the same one, and a card left by a crashed run is picked up again once its 3-hour claim expires.
4. **Auto-publisher** (GitHub Action `.github/workflows/publish.yml`, started by the Inbox at the times in `postTimesIST` of `platforms/*.json` (08:00, 13:00, 18:00, 19:30 and 21:00 IST) because GitHub's schedule never fired here, or run it by hand) runs `publisher/publish.py`: it posts the first approved video whose `slot` has passed (approved news goes first whatever its slot says; an empty slot counts as due) through Social Manager (repo `social-manager`) and marks it `posted`. One video per run, so 5 a day. To post one now, use **Run workflow** with "post now" ticked, or give an Inbox item id; only approved videos go out and nothing posts twice. Its tokens are repo secrets. Instagram fetches its copy of each video from a public link: the publisher puts the copy on this repository's `instagram-uploads` release for the length of the post, then removes it. A video longer than a platform's limit goes there only as its own version, which the video build makes; it is never cut.

Platforms: Instagram, Facebook and YouTube post live (YouTube uploads are public), and LinkedIn is parked; the publisher never posts to a personal profile.

The old How To Hero artifact queue is retired. Its unposted cards moved to the Inbox on 2026-11-15.

## Layout

- `ops/`: set up a fresh machine (`bootstrap.sh`, `doctor.sh`), the two job files (`ops/jobs/`) and what lives outside git (`ASSETS.md`). Start with `SETUP.md` "A new machine".
- `SETUP.md`: every key the jobs use, where it lives, and how to run a job on another AI platform.
- `.claude/skills/how-to-hero-video/SCOUT.md`: the daily scout (proposes news and ideas).
- `.claude/skills/how-to-hero-video/IDEAS.md`: the idea rules: video kinds, quality bar, daily mix and lengths.
- `.claude/skills/how-to-hero-video/SKILL.md`: the build run and the video rules.
- `.claude/skills/how-to-hero-video/NEWS.md`: how to find, source and build news stories.
- `.claude/skills/how-to-hero-video/flow.json`: the settings only (news per day, ideas per kind per day, backlog limits, videos per build run, claim time, pause switch, time budget, style weights). The steps are in `SKILL.md` and `SCOUT.md`. `node pipeline2/flow.mjs check` validates it, and the flow-check workflow runs that on every push and pull request that touches it.
- `.claude/skills/how-to-hero-video/inbox.sh`: the only way the jobs call the Inbox.
- `.claude/skills/how-to-hero-video/dupcheck.py`: checks a topic against every Inbox item before a job builds or proposes it, so no video is made twice.
- `.claude/skills/how-to-hero-video/pipeline/`: HyperFrames + Kokoro TTS + ffmpeg renderer, `verify.py`, and worked examples in `videos/` (`v*` shorts, `n*` news, `d*` 16:9 documentaries).
- `publisher/publish.py`: the auto-publisher.

Tokens and URLs come from the scheduled tasks' prompts or environment. Never commit them.

## Platforms

Each platform has one file, `platforms/<platform>.json` (instagram, facebook, youtube). It is the single source of truth for that platform: limits (`maxSeconds`, and `versionSeconds` for the separate version the build makes when a video is longer) and `notes` every skill reads when making videos for it. Add new findings about a platform there and nowhere else.

## Add a channel

A channel is one skill folder under `.claude/skills/<channel>/` with its own `SKILL.md` (the steps, in order) and `flow.json` (its settings, with `"channel": "<id>"`). It reuses the shared tools: `how-to-hero-video/pipeline2/` (render, verify, style picker), `publisher/` (posting, stats, weekly report) and `platforms/*.json` (platform rules). Every card it makes carries `data.channel`, so stats and the weekly report stay per channel. A step that needs a person (for example a character sheet made in the browser) is an Inbox card the run waits on while it builds other work. The second channel is Anaadi (Telugu mythology): `.claude/skills/anaadi/`, where the art set is made and checked before any episode is built.

A serialized channel (episodes that must go out in order, like Anaadi) is listed under `channels` in `platforms/youtube.json`. Its cards are ordinary `video` cards with `data.channel` and `data.episode`, approved on Telegram as usual. Each publish run uploads the next episode only (episode N+1 after N), scheduled on YouTube for the next free day at `timeIST`, so approving many at once is safe and a missing or failed episode holds the ones after it. These cards never go to How To Hero's platforms.
