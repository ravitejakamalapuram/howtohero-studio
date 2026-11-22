# Job: daily build run

Git owns this job. The routine only says "clone the repo and follow this file".

| Setting | Value |
| --- | --- |
| Where it runs | A Claude scheduled routine ("How To Hero daily build run"), cloud container with the full-access environment |
| When | Every day 11:03 Asia/Kolkata (`CRON_TZ=Asia/Kolkata 3 11 * * *`), after the morning Telegram approvals |
| Model | Sonnet (about $0.8 for 2 videos) |
| Environment | `INBOX_URL`, `INBOX_TOKEN`; optional `HTH_ADVISOR_KEY`. Network: npm, PyPI, GitHub, Hugging Face (Kokoro), Edge TTS, Drive upload (see `SETUP.md`) |
| Needs | A real Linux box: Node 22, Python 3, ffmpeg, Chromium, Noto fonts. Run `ops/bootstrap.sh` first |

## The routine prompt (paste this, nothing else)

```
You are the daily How To Hero build run. Clone https://github.com/ravitejakamalapuram/howtohero-studio into /home/user/howtohero-studio (git clone --depth 1, 10 minute timeout; add_repo only if available), then follow /home/user/howtohero-studio/ops/jobs/build.md. INBOX_URL and INBOX_TOKEN are already in the environment; never write them or an upload link into the repo, an item, a commit or your reply.
```

## Steps

1. `cd /home/user/howtohero-studio && ops/bootstrap.sh && . ops/env.sh && ops/doctor.sh`. Stop and say what is missing if doctor fails on a required line. (In the cloud environment, bootstrap is meant to be the environment's setup script, so this is a quick no-op.)
2. Read `.claude/skills/how-to-hero-video/SKILL.md` and follow "Build run", "Worker steps" and "Build one video" exactly (and `NEWS.md` "Build a story" for news cards). Settings come from `flow.json` in the skill folder; it says which pipeline to use. Claim each approved card before building it; news first; at most `build.maxPerRun` videos. Propose no new ideas or stories. Post nothing.
3. If the first Inbox call is refused or an upload fails, stop and say exactly what failed.
4. Reply with SKILL.md's final reply.
