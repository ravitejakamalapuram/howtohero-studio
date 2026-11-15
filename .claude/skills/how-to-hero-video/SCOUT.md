# Daily scout: propose news and ideas, build nothing

One run a day. It only adds cards to the Inbox for the user to approve or reject on Telegram; the build run (`SKILL.md` "Build run") makes the videos later. Building nothing keeps this run cheap. Read the numbers from `config.json` next to this file (`scout.newsMin`, `scout.newsMax`, `scout.ideas`, `scout.maxPendingIdeas`). Call the Inbox only through `inbox.sh`; never print the Inbox URL, the token or an upload link. If the first Inbox call is refused (for example by a permission check) or fails twice, stop and say so.

Two card types, never mixed up:
- `story` = a news card (`source` "news"). Approving it means "build this news video".
- `idea` = an explainer idea card. Approving it means "build this idea".
Both are proposals with nothing built. Approve sets them `approved`, which the build run reads as ready to build.

## 1. News first

News goes stale, so do it before ideas. Find stories with `NEWS.md` "Finding stories" (both lanes, ranked by virality). Run `dupcheck.py "<story in a few words>"` for each and drop it on a DUPLICATE, or when a CHECK item is the same event or finding. Propose the top ones, at most `scout.newsMax`. Aim for at least `scout.newsMin`, but never pad with weak, stale or badly sourced stories: fewer is fine. Add them in rank order, so Telegram shows the best first:

`inbox.sh call '{"action":"add","id":"story-<YYYY-MM-DD>-<short-slug>","type":"story","status":"pending","source":"news","title":"<lane A: \"Trending: \" + the news in plain words, at most 80 chars>","summary":"<the surprising claim in one sentence>. <the key numbers, each with where it is from>. Source: <URL>","data":{"lane":"<A or B>","rank":<1, 2, ...>,"sources":["<url>"],"facts":["<number or date> - <url>"],"topic":"<TECH NEWS|SPACE NEWS|SCIENCE NEWS>: <SUBJECT>","hook":"<2 short lines>","angle":"<what the video explains>"}}'`

For lane A also set `"note":"Trending: approve today, it goes stale."`. A `conflict` error means it already exists: skip it.

## 2. Then ideas

Count open idea cards: `inbox.sh call '{"action":"list","type":"idea","status":"pending","limit":1000}'`. If `scout.maxPendingIdeas` or more are waiting, propose none (the user hasn't caught up, more would only flood Telegram). Otherwise propose up to `scout.ideas`, but no more than `scout.maxPendingIdeas` minus that count.

Pick evergreen "how does it work / why is it so" topics with a surprising claim, ranked by how likely people are to watch and share them; mix the series. Before each `add`, run `dupcheck.py "<topic>"` and drop the idea on a DUPLICATE, or when a CHECK item already covers the same subject (a plain `list` sees only 100 items, so don't rely on it). Then:

`inbox.sh call '{"action":"add","type":"idea","status":"pending","title":"<the topic>","summary":"<the angle, one sentence: the surprising claim>","data":{"topic":"<topic>","angle":"<angle>","hook":"<2 short lines>","series":"<A|B|C|D>","fact":"<K when a number or date needs checking>","rank":<1, 2, ...>}}'`

## Final reply

The stories proposed (id, lane, one line each), "no suitable news today" when none qualified, and how many ideas were proposed (or "ideas skipped: <n> already waiting").
