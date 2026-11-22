# Job: daily scout (cards only)

Git owns this job. The routine itself only says "clone the repo and follow this file", so changing the job means changing git, not the routine.

| Setting | Value |
| --- | --- |
| Where it runs | A Claude scheduled routine ("How To Hero daily scout (git prompt)"; the older "news + ideas" routine is kept switched off), cloud container with the full-access environment |
| When | Every day 05:47 Asia/Kolkata (`CRON_TZ=Asia/Kolkata 47 5 * * *`) |
| Model | The project's model (Opus). The user chose this on 2026-11-16 |
| Environment | `INBOX_URL`, `INBOX_TOKEN`; optional `HTH_ADVISOR_KEY` (see `.env.example`) |
| Needs | `bash`, `curl`, `python3`, web access to news and science sites. It builds nothing, so no `ops/bootstrap.sh` |

## The routine prompt (paste this, nothing else)

```
Daily How To Hero scout run. Clone https://github.com/ravitejakamalapuram/howtohero-studio into /home/user/howtohero-studio (git clone --depth 1, 10 minute timeout; add_repo only if available), then follow /home/user/howtohero-studio/ops/jobs/scout.md. INBOX_URL and INBOX_TOKEN are already in the environment; never print them, an upload link, or write them into the repo, an item or a commit.
```

## Steps

1. Follow `.claude/skills/how-to-hero-video/SCOUT.md` exactly (step 0 fixes the person's rejected cards first, see `FIXES.md`), with the numbers in `flow.json` next to it. News `story` cards first (ranked by virality, `NEWS.md` "Finding stories"), then `idea` cards, each checked with `dupcheck.py`. It proposes cards only: build no video, post nothing anywhere.
2. The Advisor step in SCOUT.md uses `advisor.py`. If it exits 3 or times out, use the Fable subagent fallback the skill describes. Do not skip the review.
3. If the first Inbox call is refused, stop and say exactly what failed.
4. Reply with SCOUT.md's "Final reply".
