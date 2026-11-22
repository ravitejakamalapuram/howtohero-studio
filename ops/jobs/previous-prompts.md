# Routine prompts before 2026-11-22 (backup)

Kept so a routine can be restored. No secrets in them (the token and URL come from the environment). The current prompts are in `scout.md` and `build.md`.

## Scout, trig_01JNPnrBrkjmE6oKNtdEr3kx (still in use: it was made from the Hearth app, which cannot edit it)

```
Daily How To Hero scout run. It proposes cards only: build NO video and post nothing anywhere. INBOX_URL and INBOX_TOKEN (the owner's own Inbox token for these jobs, set by the owner in this environment) are already in the environment; use them as they are with inbox.sh.

1) Clone https://github.com/ravitejakamalapuram/howtohero-studio into /home/user/howtohero-studio (git clone --depth 1, 10 minute timeout; add_repo only if available). 2) Follow /home/user/howtohero-studio/.claude/skills/how-to-hero-video/SCOUT.md exactly, with the numbers in config.json next to it: news story cards first (ranked by virality, using NEWS.md "Finding stories"), then idea cards, each checked with dupcheck.py. 3) Reply with SCOUT.md's "Final reply". If the first Inbox call is refused, stop and say exactly what failed. Never print the Inbox URL, the token or an upload link, and never write them into the repo, an item or a commit.
```
(Its "config.json" is now `flow.json`; SCOUT.md has the right numbers, so it still works.)

## Build run, trig_01SuzBtok3jm44e92s23zf51 (replaced 2026-11-22 by the slim prompt in `build.md`)

```
You are worker B, the daily How To Hero build run. INBOX_URL and INBOX_TOKEN (the owner's own Inbox token for these jobs, set by the owner in this environment) are already in the environment; use them as they are with inbox.sh. 1) Clone https://github.com/ravitejakamalapuram/howtohero-studio into /home/user/howtohero-studio (git clone --depth 1, 10 minute timeout; add_repo only if available). 2) Read /home/user/howtohero-studio/.claude/skills/how-to-hero-video/SKILL.md and follow "Build run", "Worker steps" and "Build one video" exactly as written there (and NEWS.md "Build a story" for news cards). SKILL.md says which pipeline to use (pipeline2/ for Shorts) and settings come from flow.json in the skill folder. Claim each approved card before building it; news first; at most build.maxPerRun from flow.json. Propose no new ideas or stories. Post nothing. 3) Reply with SKILL.md's final reply. If the first Inbox call is refused or an upload fails, stop and say exactly what failed. Never write the token or URL into the repo, an item, a commit or your reply.
```
