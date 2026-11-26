# Job: daily manager run (growth to-dos, comment replies, promotion)

One run a day. This is the social media manager for every channel: it reads where each one stands, checks what the platforms currently reward, and hands the user a short, deduplicated list of to-dos in the Inbox, each one a thing only the user can do. It also drafts the replies to viewer comments on every channel, writes one promotion pack a week, and watches the festival calendar for the two Telugu channels. It adds at most a few new to-dos, closes the ones that are done or stale, and never builds a video, posts anything or changes a setting.

The user's rule (26 Nov 2026): the manager gives the user tasks; the user does not chase the manager. So anything a job could do itself is not a to-do. This run cannot change git, so name it in the final reply instead, for a thread to pick up.

Git owns this job. The scheduled task only says "clone the repo and follow this file", so changing the job means changing git.

| Setting | Value |
| --- | --- |
| Where it runs | A Claude scheduled task ("Daily growth tasks"), cloud container with the environment that holds the Inbox keys |
| When | Every day 07:17 Asia/Kolkata (`CRON_TZ=Asia/Kolkata 17 7 * * *`). Once a day on purpose: platform advice changes over weeks, so more runs would mostly repeat. To run more often, change only the task's schedule; the caps below keep the list short |
| Model | The project's model |
| Environment | `INBOX_URL`, `INBOX_TOKEN` |
| Needs | `bash`, `curl`, `python3`, web access. It builds nothing |

The file keeps the name `growth.md` and its to-dos keep `source` "growth", because the scheduled task and the to-do history point at them.

## The task prompt (paste this, nothing else)

```
Daily growth tasks run. Clone https://github.com/ravitejakamalapuram/howtohero-studio into /home/user/howtohero-studio (git clone --depth 1, 10 minute timeout), then follow /home/user/howtohero-studio/ops/jobs/growth.md. INBOX_URL and INBOX_TOKEN are already in the environment; never print them or write them into the repo, an item or a commit.
```

## What this job does not do

The other jobs already cover these, so leave them alone: video ideas and news cards (the daily scout), which formats and hooks win and the weekly numbers (the Monday `learn` card, `publisher/learn.py`) and collecting stats (`stats.py`). A to-do may point at one of them ("approve the 19 Chinni Slokalu cards waiting"), never redo it. Never propose pausing or cutting back a channel: How To Hero gets the focus, the others keep their current routine.

## Numbers

| Name | Value | Why |
| --- | --- | --- |
| New to-dos per run | at most 3 | Each pending to-do is a Telegram message |
| Open growth to-dos | at most 6 | Telegram shows only 20 unanswered messages, oldest first, so to-dos must not crowd out video approvals. At the cap, add only by replacing a lower priority one |
| How To Hero share | at least 2 of every 3 new to-dos; a run that adds 1 or 2 adds at least 1 for How To Hero, unless it has no worthwhile candidate | The agreed plan focuses on it |
| Stale after | 14 days pending (by `createdAt`) | An undone to-do that old was not wanted, and it holds a Telegram slot |
| Web searches | at most 8 for steps 3 and 4, plus at most 2 for the festival watch and 1 per subreddit named in a promotion pack. Reply fact-checks are not counted | Keeps the run cheap |

## Steps

Call the Inbox with `I=.claude/skills/how-to-hero-video/inbox.sh; $I call '<json>'` (it adds the token). If the first call is refused, stop and say exactly what failed.

### 1. Read where things stand

- `{"action":"channels"}`: per channel `followers`, `stats`, `totals`, `posted`, `queue`, `daysSinceLast`, `icon`.
- `{"action":"channelConfig"}`: where each channel posts (`postTo`) and is measured (`statsFrom`; empty means it falls back to `postTo`).
- The newest weekly card per channel: `{"action":"list","type":"flow-tune","order":"newest","limit":5}`; read its summary for what wins (there may be none yet).
- Every growth to-do so far, in any status: `{"action":"list","type":"todo","source":"growth","order":"newest","limit":1000}`. This is the memory of the job. "Open" below means status `pending`.

### 2. Close what is finished

For each open growth to-do (status `pending`):

- If its `data.doneWhen` can be checked from step 1 (for example "How To Hero Instagram followers at least 150" or "Chitti Slokalu has 0 cards pending"), and it is now true, set it `done` with `note` "done: <what you saw>".
- If its `createdAt` is more than 14 days ago, set it `archived` with `note` "stale: not picked up in 14 days".
- If a newer to-do replaces it (step 4, at most one a run), set it `archived` with `note` "replaced by <new title>".

Use `{"action":"update","id":"<id>","ifVersion":<version>,"set":{...}}`. On `version_conflict`, read the item again and retry once. Never touch to-dos that other jobs added.

### 3. Check what the platforms reward now

Find the current monetisation thresholds and recent official advice. Prefer official sources: YouTube Help and the Creator Insider channel, the YouTube Official Blog, Instagram's @creators and the Instagram blog, Meta for Creators and the Facebook Help Centre. Use third-party articles only to find an official page, never as the source of a threshold. Thresholds to confirm each run, because they change:

- YouTube Partner Programme: the lower tier (fan funding) and the full tier (ad revenue), both the watch hours route and the Shorts views route.
- Instagram: the follower and age bars for Gifts, Subscriptions and the bonus or creator programmes open in India.
- Facebook: content monetisation and Stars eligibility in India.

### 4. Pick at most 3 new to-dos

For each channel and each platform it posts to, compare where it stands with the nearest threshold and ask: what one action this week moves it closest? Good to-dos are concrete, doable in one sitting by the user (or by asking Claude in this project), and tied to a number: "Turn on the YouTube channel trailer and add a subscribe end screen to the 5 top Shorts", not "post consistently".

Drop a candidate when:

- an open or done growth to-do already says the same thing for the same channel and platform (compare meaning, not words), unless the number it fixed has gone back down;
- a `rejected` one, or one archived as "stale", says the same thing (the user did not want it; read its `note` for why). One archived as "replaced" does not block;
- it is a video idea, a weekly report or stats work (see "What this job does not do");
- it needs breaking a platform's rules (buying followers, follow-for-follow, automatic follows or likes, engagement pods, reuploading others' content);
- a job or a code change could do it without the user (then it is not the user's task: name it in the final reply).

Rank the rest: P1 moves a threshold this month, P2 helps within the quarter, P3 is nice to have. Keep at least 2 of every 3 for How To Hero. If 6 growth to-dos are already open, add one only if it beats the lowest ranked open one, and archive that one in step 2's way. Zero new to-dos is a fine result.

### 4a. Standing checks (they share the cap of 3 new to-dos)

- **Related video, Mondays.** YouTube lets each Short link one related video, only in Studio (there is no API, and the channel needs advanced features turned on). On Monday, for How To Hero, pick this week's best Short by day-7 views (from the weekly card or `channels`) and add one to-do: link it as the related video on the Shorts posted in the last 7 days, with the titles listed. Id `growth-how-to-hero-youtube-related-<YYYY>-w<week>`. Skip it while an older one is still open.
- **Promotion pack, Thursdays.** Follow `ops/PROMO.md`: one pack for How To Hero's best video of the last 7 days. Add a pack for Anaadi or Chinni Slokalu only in a week when a festival to-do (below) is open for it. Before the first pack, the Threads profile must exist: if no growth to-do with id `growth-how-to-hero-threads-create-profile` is `done`, add that to-do instead ("Create the How To Hero profile on Threads from the Instagram app, same name and bio; mark this done") and write no pack. A pack the user rejects with a note changes the next ones as the note says; two packs archived as stale in a row mean stop writing them and say so in the final reply.
- **Festival watch, every run.** Anaadi and Chinni Slokalu ride festivals the way How To Hero rides news. Look up the Hindu festivals of the next 14 days on drikpanchang.com (name the page in `sources`; never take a date from memory). Only 3 to 14 days ahead, because a to-do older than 14 days is archived as stale. Chinni Slokalu posts one video at a time, so for a festival it has a fitting video for, in its approved queue or pending review (list `type` video, `data.app` "Chinni Slokalu"), add one to-do: which video, and the slot to give it, 1 to 2 days before the festival. If it has none, the to-do asks the user to approve a card for it instead (name the sloka). Anaadi posts strictly in episode order, so never ask to move an episode: its to-do only suggests a festival line for that week's Threads post or community post, or is skipped when no episode in the window fits. Id `growth-<channel-slug>-festival-<festival-slug>-<YYYY>`. One festival to-do per channel at a time.
- **Same-genre cross-promotion.** Anaadi and Chinni Slokalu may point to each other; How To Hero and they never do (`ops/PROMO.md`). While either Telugu channel is under 100 subscribers, the only step worth the user's time is adding the other as a featured channel in YouTube Studio: one to-do, once (id `growth-anaadi-youtube-feature-chinni-slokalu`). Above 100, say in the final reply that a line in each channel's descriptions is now worth adding; that is a code change, not a to-do.

### 5. Add them

One call each, best first:

`$I call '{"action":"add","id":"growth-<channel-slug>-<platform>-<short-action-slug>","type":"todo","status":"pending","source":"growth","title":"<P1|P2|P3> · <Platform> · <the action, at most 70 chars>","summary":"<what to do, in at most 3 steps>. Why: <the threshold or number it moves, with the current value>. Done when: <a checkable condition>. Sources: <url>, <url>","data":{"app":"<channel name as in channels>","icon":"<that channel icon>","platform":"<youtube|instagram|facebook|all>","priority":"<P1|P2|P3>","doneWhen":"<same condition>","sources":["<url>"],"addedBy":"growth"}}'`

The `id` is the second guard against duplicates: lowercase letters, digits and dashes only, at most 100 characters. A `conflict` error means it already exists, so skip it. When re-adding a done to-do because its number went back down, add `-2` (then `-3`) to its id.

### 6. Draft comment replies

Follow `.claude/skills/how-to-hero-video/SKILL.md` "Comment replies" for every `reply` item in status `building`, whatever its channel. The drafts go to the user for approval; never post one. They are not to-dos and do not count toward the caps.

### 7. Final reply

One short message: how many to-dos were added, closed and archived, the titles of the new ones, how many growth to-dos are open per channel, and how many replies were drafted or skipped as spam.
