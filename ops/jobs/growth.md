# Job: daily growth tasks (to-dos only)

One run a day. It reads where every channel stands, checks what the platforms currently reward, and keeps one short, deduplicated list of growth to-dos in the Inbox: what the user should do next to reach monetisation, per channel and platform. It adds at most a few new to-dos, closes the ones that are done or stale, and builds, posts or changes nothing else.

Git owns this job. The scheduled task only says "clone the repo and follow this file", so changing the job means changing git.

| Setting | Value |
| --- | --- |
| Where it runs | A Claude scheduled task ("Daily growth tasks"), cloud container with the environment that holds the Inbox keys |
| When | Every day 07:17 Asia/Kolkata (`CRON_TZ=Asia/Kolkata 17 7 * * *`). Once a day on purpose: platform advice changes over weeks, so more runs would mostly repeat. To run more often, change only the task's schedule; the caps below keep the list short |
| Environment | `INBOX_URL`, `INBOX_TOKEN` |
| Needs | `bash`, `curl`, `python3`, web access. It builds nothing |

## The task prompt (paste this, nothing else)

```
Daily growth tasks run. Clone https://github.com/ravitejakamalapuram/howtohero-studio into /home/user/howtohero-studio (git clone --depth 1, 10 minute timeout), then follow /home/user/howtohero-studio/ops/jobs/growth.md. INBOX_URL and INBOX_TOKEN are already in the environment; never print them or write them into the repo, an item or a commit.
```

## What this job does not do

The other jobs already cover these, so leave them alone: video ideas and news cards (the daily scout), which formats and hooks win (the weekly `learn.py` card), the weekly numbers report (the Monday `learn` card) and collecting stats (`stats.py`). A to-do may point at one of them ("approve the 19 Chitti Slokalu cards waiting"), never redo it. Never propose pausing or cutting back a channel: How To Hero gets the focus, the others keep their current routine.

## Numbers

| Name | Value | Why |
| --- | --- | --- |
| New to-dos per run | at most 3 | Each pending to-do is a Telegram message |
| Open growth to-dos | at most 12 | A longer list stops being read; at the cap, add only by replacing a lower priority one |
| How To Hero share | at least 2 of every 3 new to-dos | The agreed plan focuses on it |
| Stale after | 30 days pending | An undone to-do that old was not wanted |
| Web searches | at most 8 | Keeps the run cheap |

## Steps

Call the Inbox with `I=.claude/skills/how-to-hero-video/inbox.sh; $I call '<json>'` (it adds the token). If the first call is refused, stop and say exactly what failed.

### 1. Read where things stand

- `{"action":"channels"}`: per channel `followers`, `stats`, `totals`, `posted`, `queue`, `daysSinceLast`, `icon`.
- `{"action":"channelConfig"}`: where each channel posts (`postTo`) and is measured (`stats_from`).
- The newest weekly card: `{"action":"list","type":"flow-tune","limit":5}`; read its summary for what wins.
- Every growth to-do so far: `{"action":"list","type":"todo","limit":1000}` and keep items whose `source` is `growth`, in any status. This is the memory of the job.

### 2. Close what is finished

For each open growth to-do (status `pending`):

- If its `data.doneWhen` can be checked from step 1 (for example "Chitti Slokalu has stats_from set" or "Instagram followers at least 150"), and it is now true, set it `done` with `note` "done: <what you saw>".
- If it was added more than 30 days ago, set it `archived` with `note` "stale: not picked up in 30 days".
- If a newer to-do replaces it, set it `archived` with `note` "replaced by <new title>".

Use `{"action":"update","id":"<id>","ifVersion":<version>,"set":{...}}`. Never touch to-dos that other jobs added.

### 3. Check what the platforms reward now

Find the current monetisation thresholds and recent official advice. Prefer official sources: YouTube Help and the Creator Insider channel, the YouTube Official Blog, Instagram's @creators and the Instagram blog, Meta for Creators and the Facebook Help Centre. Use third-party articles only to find an official page, never as the source of a threshold. Thresholds to confirm each run, because they change:

- YouTube Partner Programme: the lower tier (fan funding) and the full tier (ad revenue), both the watch hours route and the Shorts views route.
- Instagram: the follower and age bars for Gifts, Subscriptions and the bonus or creator programmes open in India.
- Facebook: content monetisation and Stars eligibility in India.

### 4. Pick at most 3 new to-dos

For each channel and each platform it posts to, compare where it stands with the nearest threshold and ask: what one action this week moves it closest? Good to-dos are concrete, doable in one sitting by the user (or by asking Claude in this project), and tied to a number: "Turn on the YouTube channel trailer and add a subscribe end screen to the 5 top Shorts", not "post consistently".

Drop a candidate when:

- an open or done growth to-do already says the same thing for the same channel and platform (compare meaning, not words), unless the number it fixed has gone back down;
- an archived one says the same thing (the user did not want it);
- it is a video idea, a weekly report or stats work (see "What this job does not do");
- it needs breaking a platform's rules (buying followers, follow-for-follow, engagement pods, reuploading others' content).

Rank the rest: P1 moves a threshold this month, P2 helps within the quarter, P3 is nice to have. Keep at least 2 of every 3 for How To Hero. If 12 growth to-dos are already open, add one only if it beats the lowest ranked open one, and archive that one in step 2's way. Zero new to-dos is a fine result.

### 5. Add them

One call each, best first:

`$I call '{"action":"add","id":"growth-<channel-slug>-<platform>-<short-action-slug>","type":"todo","status":"pending","source":"growth","title":"<P1|P2|P3> · <Platform> · <the action, at most 70 chars>","summary":"<what to do, in at most 3 steps>. Why: <the threshold or number it moves, with the current value>. Done when: <a checkable condition>. Sources: <url>, <url>","data":{"app":"<channel name as in channels>","icon":"<that channel icon>","platform":"<youtube|instagram|facebook|all>","priority":"<P1|P2|P3>","doneWhen":"<same condition>","sources":["<url>"],"addedBy":"growth"}}'`

The fixed `id` is the second guard against duplicates: a `conflict` error means it already exists, so skip it.

### 6. Final reply

One short message: how many to-dos were added, closed and archived, the titles of the new ones, and how many growth to-dos are open per channel.
