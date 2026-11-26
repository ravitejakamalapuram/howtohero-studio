# howtohero-studio

The How To Hero video studio. Claude routines find ideas, build vertical explainer videos and hand them to you for approval; GitHub Actions post the approved ones, collect the numbers and propose what to change next week. The same tools also publish the serialized channels Anaadi and The Last Signal.

## How it fits with the other repos

```
            scout (Claude, daily)          build (Claude, daily)
                    │ idea/story cards             │ finished videos
                    ▼                              ▼
   inbox ─ Google Sheet + dashboard + Telegram buttons  ◄── you approve or reject
      │ starts "publish" at the post times     ▲ stats, weekly report, comment replies
      ▼                                        │
   publisher/*.py (GitHub Actions, this repo) ─┘
      │ publish, stats, comments
      ▼
   social-manager ─► YouTube, Instagram, Facebook
```

- [**inbox**](https://github.com/ravitejakamalapuram/inbox) holds every card (idea, story, video, reply, report), the per-channel config and the Telegram approve/reject buttons. Jobs reach it only through `.claude/skills/how-to-hero-video/inbox.sh` (Claude jobs) and `publisher/publish.py` (Actions).
- [**social-manager**](https://github.com/ravitejakamalapuram/social-manager) is the posting service. This repo never talks to a platform directly; it calls Social Manager's `publish`, `stats`, `comments` and `reply` actions.
- **This repo** owns the content rules, the renderer and the publisher.

## What runs, and when

| Job | Where | When (IST) | What it does |
| --- | --- | --- | --- |
| Scout | Claude routine, `ops/jobs/scout.md` → `SCOUT.md` | 05:47 daily | Fixes rejected cards first (`FIXES.md`), then proposes news `story` cards (ranked by virality) and `idea` cards (`IDEAS.md`), each checked with `dupcheck.py`. Builds nothing. |
| Build | Claude routine, `ops/jobs/build.md` → `SKILL.md` "Build run" | 11:03 daily | Claims approved cards (news first), builds up to 10 videos one at a time, verifies each, uploads it to the Inbox as `pending`. A claim lasts 3 hours, so a crashed run's card is picked up again. |
| Publish | `.github/workflows/publish.yml` | Started by the Inbox at `postTimesIST` in `platforms/*.json` (08:00, 13:00, 18:00, 19:30, 21:00) | `replies.py` posts approved comment replies and brings in new comments; `publish.py` posts one approved video whose slot has passed (news first) to every connected platform, then marks it `posted`. Serialized channels go out strictly in episode order. |
| Stats | `.github/workflows/stats.yml` | 06:53 daily | `stats.py` reads followers, views, likes and comments (Instagram, Facebook, YouTube) and sends them to the Inbox Channels page. |
| Learn | `.github/workflows/learn.yml` | Mondays 09:11 | `learn.py` sends the weekly report (including YouTube monetisation progress) and a tuning proposal as one Inbox card; once you approve it, the next run writes it into `flow.json` and commits it. |
| Checks | `flow-check.yml`, `bootstrap-check.yml` | On push / weekly | Validate `flow.json` and make sure a fresh machine can still render. |

GitHub's own cron never fired for the publish workflow here, which is why the Inbox starts it. To post now, use **Run workflow** on `publish` with "post now" ticked, or give an Inbox item id.

## Layout

- `.claude/skills/how-to-hero-video/`: the main channel. `SCOUT.md` (scout), `SKILL.md` (build run and video rules), `IDEAS.md`, `NEWS.md`, `FIXES.md`, `THUMBNAILS.md`, and `flow.json` (settings only: daily mix, backlog limits, videos per run, claim time, pause switch, style weights).
  - `pipeline/`: the default v1 renderer (HyperFrames + Kokoro TTS + ffmpeg), `verify.py` and worked examples in `videos/`.
  - `pipeline2/`: the multi-style renderer (whiteboard, blueprint, chalkboard...), used only when a card asks for it.
- `.claude/skills/anaadi/`: the Anaadi channel (Telugu mythology, character art made before any episode).
- `publisher/`: `publish.py`, `replies.py`, `stats.py`, `learn.py`.
- `platforms/*.json`: one file per platform, the single source of truth for its limits, post times and notes; `youtube.json` also lists the serialized channels.
- `ops/`: machine setup (`bootstrap.sh`, `env.sh`, `doctor.sh`), the look check (`golden-check.sh`), the two routine files (`jobs/`) and what lives outside git (`ASSETS.md`).
- `SETUP.md`: every key, where it lives, and how to run a job on another AI platform. `.env.example` lists the names.

## Set up this studio on a new account (same quality videos)

Do these in order. Nothing here needs the old accounts, and no token or link is ever stored in git.

1. **Accounts you need:** GitHub, Google (the Inbox Sheet and Drive), Telegram (a bot for approvals), Claude (scheduled routines), and the platforms you post to (YouTube, Instagram and Facebook through a Meta app). `SETUP.md` lists every key and where it lives.
2. **Fork or clone the three repos:** `howtohero-studio` (this one), `inbox` (approvals app) and `social-manager` (posting service). Each has a `docs/FAQ.md` section "What is not in git" that says what to redo on a new Google account (Sheet, Script Properties, consent screens, the new `/exec` URL).
3. **Make the tokens and set the GitHub secrets** (`INBOX_URL`, `INBOX_TOKEN`, `SOCIAL_URL`, `SOCIAL_TOKEN`) as in `SETUP.md`. Use `.env.example` for the names.
4. **Set up the build machine:** run `ops/bootstrap.sh` once, then `. ops/env.sh` in each shell (pinned Node, Python and font tools; `ops/doctor.sh` says what is missing).
5. **Prove the look before any real video:** run `ops/golden-check.sh`. It rebuilds the worked example v17 (Rajasaurus) from git and prints a contact sheet. It must match `ops/golden/v1-look-reference.jpg` (indigo background, Anton headline with one yellow word, a drawn picture on every beat, caption below, mascot end card). `ops/golden/v1-posted-originals.jpg` shows two posted originals next to rebuilt frames. If the sheet differs, stop: something in the setup is wrong.
6. **Create the two routines** from `ops/jobs/scout.md` and `ops/jobs/build.md` (paste the short prompt shown in each, nothing else), with the schedule and environment variables each file lists.
7. **Optional, Anaadi:** restore the character art from the backup described in `ops/ASSETS.md` and run `ops/bootstrap.sh --anaadi`.

The default look is the original v1 pipeline (`.claude/skills/how-to-hero-video/pipeline/`). The multi-style renderer (`pipeline2/`) is used only when a card's note asks for it. Do not change the v1 look without the owner's say.

Tokens and URLs come from the scheduled tasks' prompts or environment. Never commit them.

## Run things by hand

```bash
ops/bootstrap.sh && . ops/env.sh      # once per machine, then in each shell
ops/doctor.sh                         # says what is missing
ops/golden-check.sh                   # rebuilds v17 and prints a contact sheet to compare
node .claude/skills/how-to-hero-video/pipeline2/flow.mjs check    # validate flow.json

# needs INBOX_URL, INBOX_TOKEN, SOCIAL_URL, SOCIAL_TOKEN in the environment
python3 publisher/publish.py --dry-run
python3 publisher/learn.py --dry-run
python3 publisher/stats.py
```

To build one video by hand, follow `SKILL.md` "Build one video" (v1 pipeline: write `videos/vN.json` and `vN.scenes.js`, build, `npx hyperframes render`, sound pass, `verify.py`). `stats.py` has no dry run; running it twice on one day just replaces that day's numbers.

## Platforms

Each platform has one file, `platforms/<platform>.json` (instagram, facebook, youtube). It is the single source of truth for that platform: limits (`maxSeconds`, and `versionSeconds` for the separate version the build makes when a video is longer) and `notes` every skill reads when making videos for it. Add new findings about a platform there and nowhere else.

## Add a channel

A channel is one skill folder under `.claude/skills/<channel>/` with its own `SKILL.md` (the steps, in order) and `flow.json` (its settings, with `"channel": "<id>"`). It reuses the shared tools: `how-to-hero-video/pipeline2/` (render, verify, style picker), `publisher/` (posting, stats, weekly report) and `platforms/*.json` (platform rules). Every card it makes carries `data.channel`, so stats and the weekly report stay per channel. A step that needs a person (for example a character sheet made in the browser) is an Inbox card the run waits on while it builds other work. The second channel is Anaadi (Telugu mythology): `.claude/skills/anaadi/`, where the art set is made and checked before any episode is built.

A serialized channel (episodes that must go out in order, like Anaadi) is listed under `channels` in `platforms/youtube.json`. Its cards are ordinary `video` cards with `data.channel` and `data.episode`, approved on Telegram as usual. Each publish run uploads the next episode only (episode N+1 after N), scheduled on YouTube for the next free day at `timeIST`, so approving many at once is safe and a missing or failed episode holds the ones after it. These cards never go to How To Hero's platforms.
