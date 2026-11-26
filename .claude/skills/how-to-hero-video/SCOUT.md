# Daily scout: propose news and ideas, build nothing

One run a day. It only adds cards to the Inbox for the user to approve or reject on Telegram; the build run (`SKILL.md` "Build run") makes the videos later. Building nothing keeps this run cheap. Read the numbers from `flow.json` next to this file (`scout`). What makes a good idea, the kinds of video and the daily mix are in `IDEAS.md`; follow it. Call the Inbox only through `inbox.sh`; never print the Inbox URL, the token or an upload link. If the first Inbox call is refused (for example by a permission check) or fails twice, stop and say so.

Two card types, never mixed up:
- `story` = a news card (`source` "news"). Approving it means "build this news video".
- `idea` = an explainer idea card. Approving it means "build this idea".
Both are proposals with nothing built. Approve sets them `approved`, which the build run reads as ready to build.

## 0. Fix rejected cards first

The person gives a reason for every rejection. Before proposing anything new, fix their rejected `story` and `idea` cards as `FIXES.md` says: `fixlist.py --max <fix.maxFixes> --limit <fix.maxPerRun> --types story,idea --not-channel anaadi`, then fix and send each back as `pending`. A fixed news story that has gone stale (the news is old now) is dropped instead: release it as rejected with `data.fixFailures` 2. Fixed cards count toward `scout.maxPendingIdeas`. Fixing adds no advisor step; only new cards go there.

## 1. News first

News goes stale, so do it before ideas. Find stories with `NEWS.md` "Finding stories" (both lanes, ranked by virality). Run `dupcheck.py "<story in a few words>"` for each and drop it on a DUPLICATE, or when a CHECK item is the same event or finding. Pick the top ones, at most `scout.newsMax`. Aim for at least `scout.newsMin`, but never pad with weak, stale or badly sourced stories: fewer is fine. Draft them, don't add them yet: they go to the advisor with the ideas (step 3). Each is added later in rank order, so Telegram shows the best first, as:

`inbox.sh call '{"action":"add","id":"story-<YYYY-MM-DD>-<short-slug>","type":"story","status":"pending","source":"news","title":"<lane A: \"Trending: \" + the news in plain words, at most 80 chars>","summary":"<the surprising claim in one sentence>. <the key numbers, each with where it is from>. Source: <URL>","data":{"kind":"news","lane":"<A or B>","rank":<1, 2, ...>,"sources":["<url>"],"facts":["<number or date> - <url>"],"topic":"<TECH NEWS|SPACE NEWS|SCIENCE NEWS>: <SUBJECT>","hook":"<2 short lines>","angle":"<what the video explains>","search":"<the phrase people would type, see IDEAS.md>","geo":"<global|india|us>"}}'`

For lane A also set `"note":"Trending: approve today, it goes stale."`. A `conflict` error means it already exists: skip it.

## 2. Then ideas

Read `IDEAS.md` first: it defines the idea kinds (`explainer`, `fact`, `curiosity`, `doc`), the quality bar every card must pass, the daily mix and the card fields. Read `platforms/*.json` (repo root) for the length limits it refers to.

Viewer questions: list viewer comments tagged `question` or `idea` from the last 30 days: `inbox.sh call '{"action":"list","type":"reply","limit":200}'` and keep those whose `data.tag` is `question` or `idea`. When the same question or topic appears twice or more and no card covers it (dupcheck), propose it as an idea card with `"why":"asked by <n> viewers"`.

What is working: read the newest weekly report, `inbox.sh call '{"action":"list","type":"flow-tune","limit":5}'` (the card with the latest id; its `summary` ranks `kind`, `hookPattern` and `length` by day-7 views, and the hook and opening shapes of `HOOKS.md` by how many viewers stayed). Where it ranks a value ahead with enough videos, lean this run toward it: more cards of the winning `kind` within the `scout.mix` limits, and hooks written in the winning pattern. Never drop a kind to zero, and ignore values it marks "not enough data". With no report yet, skip this.

Count the backlog: `inbox.sh call '{"action":"list","type":"idea","status":"pending,approved","limit":1000}'` and count pending and approved separately. Apply the backlog rule in `IDEAS.md` "The daily mix" to decide how many idea cards to propose this run, then fill each kind of `scout.mix` with the best cards that pass the bar. Draft the ideas, don't add them yet. For each, run `dupcheck.py "<topic>"` and drop the idea on a DUPLICATE, or when a CHECK item already covers the same subject (a plain `list` sees only 100 items, so don't rely on it). Each is added later as:

`inbox.sh call '{"action":"add","type":"idea","status":"pending","title":"<the topic>","summary":"<the angle, one sentence: the surprising claim>","data":{"kind":"<explainer|fact|curiosity>","topic":"<topic>","angle":"<angle>","hook":"<2 short lines>","search":"<the phrase people would type, see IDEAS.md>","why":"<one line: why people will watch and share it>","sources":["<url>"],"fact":"<K or C>","maxSeconds":<from IDEAS.md>,"rank":<1, 2, ...>,"geo":"<global|india|us>"}}'`

`geo` is who the video is for: `india` or `us` when the story is about that country, else `global`. Keep about 80% of cards `global`; name the country in the hook of every `india` or `us` card.

A documentary card (only when `IDEAS.md` allows one today) uses `"id":"doc-<slug>"`, `"kind":"doc"`, `"series":"DOC"`.

## 3. Advisor, then add

Write every drafted card (news first, then ideas: title, summary and `data` as drafted) and its `dupcheck.py` output to `/tmp/cards.txt`, and run `python3 advisor.py cards /tmp/cards.txt` once (see `SKILL.md` "Advisor", including its fallback on exit code 3). Drop each card it marks DROP, apply each FIX, and use its BEST order for the `rank`. Then add the news cards, then the ideas, with the `add` calls above.

## 4. Comment replies

Draft the waiting comment replies as in `SKILL.md` "Comment replies".

## Final reply

The stories proposed (id, lane, one line each), "no suitable news today" when none qualified, then the ideas proposed (kind, title, hook, one line each), the backlog counts (pending, approved) any kind that had no card good enough today, how many cards the advisor dropped or fixed, its cost line (or the fallback reason), and the comment replies drafted and skipped.
