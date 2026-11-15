# Daily news explainer (Inbox, story first)

One run a day. Never post anything. Uses `inbox.sh` (next to this file); never print the Inbox URL, the token or an upload link. Times are IST.

Approval flow:
- **Lane B (science, space, tech research):** the run proposes the story as an Inbox item of type `story`. The person approves it on Telegram during the day, and the next run builds it.
- **Lane A (trending tech or infrastructure event):** no story approval. It goes stale within hours, so the run builds it straight away.
- Every finished video goes to the person as type `video`, `pending`, with a `slot`. Once they approve it, the Inbox sends a Telegram reminder at the slot time with the captions in `data.reminder`. Posting stays manual.

## Steps, in this order

1. **Build approved stories.** Repeat up to 2 times: `inbox.sh call '{"action":"claimNext","by":"news-<4 random chars>","type":"story","status":"approved","set":{"status":"building"}}'`. `"item": null` means none, go to step 2. Otherwise re-open each source in `data.sources` with WebFetch and confirm every number and date again (the story may be a day old). Follow the person's `note` if there is one. Build it as in "Build" below, then hand it in as in "Hand in", reusing the same item id (use `release` with `by` instead of `update`). If the facts no longer hold or the build fails twice: `release` with `"set":{"status":"rejected","note":"<why>"}`.
2. **Find today's story.** Look at the last 48 hours in two lanes.
   - A. A trending tech or infrastructure story that lots of people felt today: a big app or cloud outage, airline or air-traffic IT failure, power grid failure, a major phone, chip or AI launch. Explain the engineering, not the drama. Facts about the event itself must come from the company's own status page or incident report, or an official body (FAA, DOT, a grid operator). If the cause isn't officially stated, say "the company hasn't said exactly what broke" and explain how this kind of failure usually happens. Skip it if people were hurt or killed, or if it is mainly a strike, lawsuit or political fight.
   - B. Science, space or tech news from primary sources: nasa.gov, science.nasa.gov, jpl.nasa.gov, esa.int, isro.gov.in, noaa.gov, nature.com news, science.org, eurekalert.org, university or lab press releases. The source page must be dated within the last 48 hours (a republished old study does not count).
   - Never: politics, wars, disasters with victims, crime, health scares, celebrity or market news, other people's footage or logos. Open each source with WebFetch and write down every number and date you will say, with its URL. Leave out anything not on such a page.
   - Skip duplicates: `inbox.sh call '{"action":"list","source":"news"}'` (all types and statuses) and the artifact queue https://claude.ai/artifact/No6GD7nRQcrbBz8Sb7zScw collection `ideas` where `series` == "NEWS". Don't repeat a story already in either.
3. **Lane A found:** build it now ("Build"), hand it in ("Hand in") with a new item id, slot = today 12:30 if before 11:00 now, else today 18:30 (the "Trending story" note applies).
4. **Lane B found (and no lane A):** propose up to 2 stories, unless 4 or more `story` items are already `pending` (then propose none). For each: `inbox.sh call '{"action":"add","id":"story-<YYYY-MM-DD>-<short-slug>","type":"story","status":"pending","source":"news","title":"<the news in plain words, at most 80 chars>","summary":"<the surprising claim in one sentence>. <the key numbers, each with where it is from>. Source: <URL>","data":{"lane":"B","sources":["<url>"],"facts":["<number or date> - <url>"],"topic":"SCIENCE NEWS: <SUBJECT>","hook":"<2 short lines>","angle":"<what the video explains>"}}'`. A `conflict` error means it already exists: skip it.
5. Nothing qualifies anywhere: say "no suitable news today".
6. Copy each finished MP4 into /mnt/project-files/news/.

## Build

`cp -r .claude/skills/how-to-hero-video/pipeline /tmp/hth`, then in /tmp/hth: `npm i hyperframes@0.9.30` and `pip install kokoro-onnx soundfile`; set HYPERFRAMES_TELEMETRY=0. Run check, snapshot and render with `npx -y hyperframes@0.9.33 ...`. Follow SKILL.md "Build one video" and "Rules" with these differences: id `n<YYYYMMDD>` (add `b` for a second video the same day), `topic` "TECH NEWS: <SUBJECT>" / "SPACE NEWS: ..." / "SCIENCE NEWS: ...", 10 beats, the first beat states the news in plain words, then explain the mechanism, the last spoken line is "Follow for how things work, in a minute.", `build.mjs` end at most 61 s. Snapshot every beat and fix overlaps (keep drawings out of the top ~350 px of the beat box during beat 0, where the hook sits). Draw generic shapes, no real logos. Render, then `python3 verify.py <id>`: 0 violations required. Worked examples: `videos/n1.json` + `n1.scenes.js` on branch claude/project-thread-9853aa.

## Hand in

Slot for lane B: the first 08:30 on or after tomorrow that no other `source` "news" item and no NEWS artifact card uses.

1. New item (lane A only; lane B reuses the claimed story id): `inbox.sh call '{"action":"add","id":"news-<YYYY-MM-DD>-<short-slug>","type":"video","status":"building","source":"news",...}'`.
2. `inbox.sh up <mp4> <id>`.
3. `inbox.sh call` with `update` (or `release` + `by` for a claimed story) setting: `"type":"video"`, `"status":"pending"`, `"title":"<yt title>"`, `"slot":"<YYYY-MM-DD>T<HH:MM>:00+05:30"`, `"summary":"<story in one line>. <duration> s, <verification result>. Sources: <URLs>"`, and `data` with `lane`, `sources`, `videoRef` (SKILL.md format), `yt` (title + " #shorts", no clickbait), `ig` (caption + "Follow @howtohero.official" + 3-4 hashtags), `pin`, `note` ("NEWS - check facts against sources before posting. Description must list the sources." plus, for lane A, "Trending story: post the same day or it goes stale."), and `reminder` = "YouTube title:\n<yt>\n\nDescription:\n<one-line summary>\nSources: <URLs>\n\nInstagram:\n<ig>\n\nPinned comment:\n<pin>". Set the status to `pending` only now, so the video reaches the person once the file is attached.

If the first Inbox call is refused (for example by a permission check) or fails twice, stop and say so; there is no artifact fallback for stories. Once an item exists, if a call fails twice, report which one and stop.

## Final reply

One line per video (item id, story, lane, duration, verification result, slot), the story ids proposed, and "no suitable news today" when nothing qualified.
