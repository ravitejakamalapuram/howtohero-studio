# How To Hero news (stories)

News reaches the user as a `story` card first. Nothing is built until they approve it on Telegram. The scout (`SCOUT.md`) finds and proposes stories with "Finding stories"; the build run (`SKILL.md` "Build run") builds approved ones with "Build a story". Never post anything. Never print the Inbox URL, the token or an upload link. Times are IST.

Lanes, in `data.lane`:
- **A, trending** tech or infrastructure event. It goes stale within hours, so its card says "Trending: approve today" and the build run takes it before anything else.
- **B, science, space or tech research** from primary sources.

Every finished video goes to the person as type `video`, `pending`, with a `slot`. Once they approve it, it stays `approved` until the automatic publisher posts it (the slot says when). Never set `data.remind`: the user wants no manual posting reminders. Keep the captions in `data.reminder` for the publisher.

## Finding stories

Look at the last 48 hours in both lanes.
- A. A trending tech or infrastructure story that lots of people felt today: a big app or cloud outage, airline or air-traffic IT failure, power grid failure, a major phone, chip or AI launch. Explain the engineering, not the drama. Facts about the event itself must come from the company's own status page or incident report, or an official body (FAA, DOT, a grid operator). If the cause isn't officially stated, say "the company hasn't said exactly what broke" and explain how this kind of failure usually happens. Skip it if people were hurt or killed, or if it is mainly a strike, lawsuit or political fight.
- B. Science, space or tech news from primary sources: nasa.gov, science.nasa.gov, jpl.nasa.gov, esa.int, isro.gov.in, noaa.gov, nature.com news, science.org, eurekalert.org, university or lab press releases. The source page must be dated within the last 48 hours (a republished old study does not count).
- Never: politics, wars, disasters with victims, crime, health scares, celebrity or market news, other people's footage or logos. Open each source with WebFetch and write down every number and date you will say, with its URL. Leave out anything not on such a page.
- Skip duplicates: before proposing a story, run `dupcheck.py "<story in a few words>"` (next to this file). It compares with every Inbox item: earlier news, stories and the regular explainers, in every status. Drop the story on a DUPLICATE, or when a CHECK item is the same event or finding.

Rank what qualifies by likely virality, highest first: how many people felt it or are talking about it today (trending lists, front pages of big tech and science sites, Hacker News, Reddit r/technology, r/space, r/science), how surprising the one-line claim is, and whether it draws well as simple shapes. Lane A usually ranks first.

## Build a story

1. Re-open each source in `data.sources` with WebFetch and confirm every number and date again (the story may be a day old). Follow the person's `note` if there is one. If the facts no longer hold, release with `"set":{"status":"rejected","note":"<why>"}`.
2. Build it as in "Build", then hand it in as in "Hand in". If the build fails twice, release with `"set":{"status":"rejected","note":"<why>"}`.
3. Copy the finished MP4 into /mnt/project-files/news/.

## Build

`cp -r .claude/skills/how-to-hero-video/pipeline /tmp/hth`, then in /tmp/hth: `npm i hyperframes@0.9.30` and `pip install kokoro-onnx soundfile`; set HYPERFRAMES_TELEMETRY=0. Run check, snapshot and render with `npx -y hyperframes@0.9.33 ...`. Follow SKILL.md "Build one video" and "Rules" with these differences: id `n<YYYYMMDD>` (add `b` for a second video the same day), `topic` "TECH NEWS: <SUBJECT>" / "SPACE NEWS: ..." / "SCIENCE NEWS: ...", 10 beats, the first beat states the news in plain words, then explain the mechanism, the last spoken line is "Follow for how things work, in a minute.", `build.mjs` end at most 61 s. Snapshot every beat and fix overlaps (keep drawings out of the top ~350 px of the beat box during beat 0, where the hook sits). Draw generic shapes, no real logos. Render, then `python3 verify.py <id>`: 0 violations required. Worked example: `videos/n1.json` + `n1.scenes.js`.

## Hand in

Slot: lane A (trending) = the next of today 12:30 or 18:30 that is at least 1 hour away, else tomorrow 08:30. Lane B = the first 08:30 on or after tomorrow that no other `source` "news" item uses.

Reuse the claimed story id.

1. `inbox.sh up <mp4> <id>`.
2. `inbox.sh call` with `release` + `by` setting: `"type":"video"`, `"status":"pending"`, `"title":"<yt title>"`, `"slot":"<YYYY-MM-DD>T<HH:MM>:00+05:30"`, `"summary":"<story in one line>. <duration> s, <verification result>. Sources: <URLs>"`, and `data` with `lane`, `sources`, `videoRef` (SKILL.md format), `yt` (title + " #shorts", no clickbait), `ig` (caption + "Follow @howtohero.official" + 3-4 hashtags), `pin`, `note` ("NEWS - check facts against sources before posting. Description must list the sources." plus, for lane A, "Trending story: post the same day or it goes stale."), and `reminder` = "YouTube title:\n<yt>\n\nDescription:\n<one-line summary>\nSources: <URLs>\n\nInstagram:\n<ig>\n\nPinned comment:\n<pin>". Set the status to `pending` only now, so the video reaches the person once the file is attached.
