# Daily scout: propose news and ideas, build nothing

One run a day. It only adds cards to the Inbox for the user to approve or reject on Telegram; the build run (`SKILL.md` "Build run") makes the videos later. Building nothing keeps this run cheap. Read the numbers from `config.json` next to this file (`scout`). What makes a good idea, the kinds of video and the daily mix are in `IDEAS.md`; follow it. Call the Inbox only through `inbox.sh`; never print the Inbox URL, the token or an upload link. If the first Inbox call is refused (for example by a permission check) or fails twice, stop and say so.

Two card types, never mixed up:
- `story` = a news card (`source` "news"). Approving it means "build this news video".
- `idea` = an explainer idea card. Approving it means "build this idea".
Both are proposals with nothing built. Approve sets them `approved`, which the build run reads as ready to build.

## 1. News first

News goes stale, so do it before ideas. Find stories with `NEWS.md` "Finding stories" (both lanes, ranked by virality). Run `dupcheck.py "<story in a few words>"` for each and drop it on a DUPLICATE, or when a CHECK item is the same event or finding. Propose the top ones, at most `scout.newsMax`. Aim for at least `scout.newsMin`, but never pad with weak, stale or badly sourced stories: fewer is fine. Add them in rank order, so Telegram shows the best first:

`inbox.sh call '{"action":"add","id":"story-<YYYY-MM-DD>-<short-slug>","type":"story","status":"pending","source":"news","title":"<lane A: \"Trending: \" + the news in plain words, at most 80 chars>","summary":"<the surprising claim in one sentence>. <the key numbers, each with where it is from>. Source: <URL>","data":{"kind":"news","lane":"<A or B>","rank":<1, 2, ...>,"sources":["<url>"],"facts":["<number or date> - <url>"],"topic":"<TECH NEWS|SPACE NEWS|SCIENCE NEWS>: <SUBJECT>","hook":"<2 short lines>","angle":"<what the video explains>"}}'`

For lane A also set `"note":"Trending: approve today, it goes stale."`. A `conflict` error means it already exists: skip it.

## 2. Then ideas

Read `IDEAS.md` first: it defines the idea kinds (`explainer`, `fact`, `curiosity`, `doc`), the quality bar every card must pass, the daily mix and the card fields. Read `platforms/*.json` (repo root) for the length limits it refers to.

Count the backlog: `inbox.sh call '{"action":"list","type":"idea","status":"pending,approved","limit":1000}'` and count pending and approved separately. Apply the backlog rule in `IDEAS.md` "The daily mix" to decide how many idea cards to propose this run, then fill each kind of `scout.mix` with the best cards that pass the bar. Before each `add`, run `dupcheck.py "<topic>"` and drop the idea on a DUPLICATE, or when a CHECK item already covers the same subject (a plain `list` sees only 100 items, so don't rely on it). Then:

`inbox.sh call '{"action":"add","type":"idea","status":"pending","title":"<the topic>","summary":"<the angle, one sentence: the surprising claim>","data":{"kind":"<explainer|fact|curiosity>","topic":"<topic>","angle":"<angle>","hook":"<2 short lines>","why":"<one line: why people will watch and share it>","sources":["<url>"],"fact":"<K or C>","maxSeconds":<from IDEAS.md>,"rank":<1, 2, ...>}}'`

A documentary card (only when `IDEAS.md` allows one today) uses `"id":"doc-<slug>"`, `"kind":"doc"`, `"series":"DOC"`.

## Final reply

The stories proposed (id, lane, one line each), "no suitable news today" when none qualified, then the ideas proposed (kind, title, hook, one line each), the backlog counts (pending, approved) and any kind that had no card good enough today.
