# How To Hero news (stories)

News reaches the user as a `story` card first. Nothing is built until they approve it on Telegram. The scout (`SCOUT.md`) finds and proposes stories with "Finding stories"; the build run (`SKILL.md` "Build run") builds approved ones with "Build a story". Never post anything. Never print the Inbox URL, the token or an upload link. Times are IST.

Lanes, in `data.lane`:
- **A, trending** tech or infrastructure event. It goes stale within hours, so its card says "Trending: approve today" and the build run takes it before anything else.
- **B, science, space or tech research** from primary sources.

Every finished video goes to the person as type `video`, `pending`, with a `slot`. Once they approve it, it stays `approved` until the automatic publisher posts it (the slot says when). Never set `data.remind`: the user wants no manual posting reminders. Keep the captions in `data.reminder` for the publisher.

## Finding stories

Look at the last `scout.newsWindowHours` (48) hours in both lanes. On Saturday, Sunday and Monday (the person's time) lane B uses `scout.newsWindowWeekendHours` (72) instead, because labs and agencies publish little at weekends; lane A stays at 48, since it is about what people felt today.
- A. A trending tech or infrastructure story that lots of people felt today: a big app or cloud outage, airline or air-traffic IT failure, power grid failure, a major phone, chip or AI launch. Explain the engineering, not the drama. Facts about the event itself must come from the company's own status page or incident report, or an official body (FAA, DOT, a grid operator). If the cause isn't officially stated, say "the company hasn't said exactly what broke" and explain how this kind of failure usually happens. Skip it if people were hurt or killed, or if it is mainly a strike, lawsuit or political fight.
- B. Science, space or tech news from primary sources: nasa.gov, science.nasa.gov, jpl.nasa.gov, esa.int, isro.gov.in, noaa.gov, nature.com news, science.org, eurekalert.org, university or lab press releases. The source page must be dated inside the lane B window (a republished old study does not count).
- Never: politics, wars, disasters with victims, crime, health scares, celebrity or market news, other people's footage or logos. Open each source with WebFetch and write down every number and date you will say, with its URL. Leave out anything not on such a page.
- Skip duplicates: before proposing a story, run `dupcheck.py "<story in a few words>"` (next to this file). It compares with every Inbox item: earlier news, stories and the regular explainers, in every status. Drop the story on a DUPLICATE, or when a CHECK item is the same event or finding.

- **Best of the week fallback.** If fewer than `scout.newsMin` stories qualify, look back `scout.weekFallbackDays` (7) days in lane B only (never lane A: a week-old outage is stale) with the same source and number rules, except that the source page may be up to that many days old, and take the strongest unused ones to reach `newsMin`. Their cards say "Best of the week" instead of "Trending", and they rank below every fresh story, whatever their virality. No card is padded: if nothing from the week passes the source rules, fewer is fine.

Rank what qualifies by likely virality, highest first: how many people felt it or are talking about it today (trending lists, front pages of big tech and science sites, Hacker News, Reddit r/technology, r/space, r/science), how surprising the one-line claim is, and whether it draws well as simple shapes. Lane A usually ranks first.

## Build a story

1. Re-open each source in `data.sources` with WebFetch and confirm every number and date again (the story may be a day old). Follow the person's `note` if there is one. If the facts no longer hold, release with `"set":{"status":"rejected","note":"<why>"}`.
2. Build it as in "Build", then hand it in as in "Hand in". If the build fails twice, release with `"set":{"status":"rejected","note":"<why>"}`.
3. Copy the finished MP4 into /mnt/project-files/news/.

## Build

Follow SKILL.md "Build one video" (the default v1 pipeline) with these differences: id `n<YYYYMMDD>` (add `b` for a second video the same day), `topic` (the on-screen label) = the subject only, 1-3 words ("RADIO PULSE STAR"; never "SPACE NEWS: ..." even when the card's `data.topic` has it, because a news label reads as a bulletin and Shorts viewers swipe), up to 8 spoken beats plus the silent end card, the first beat states the surprising claim itself in plain words (and names the country for an `india` or `us` card), never the reporting ("Astronomers found...", "On November 18...", "Four years after..."), then explain the mechanism. Leave out how it was found (which telescope, how many hours of data, which team) unless that is the surprise. The last spoken line is the payoff and the end card is the silent one from SKILL.md (no spoken "follow" line). About 35-45 s, at most 61 s. Don't copy `pipeline/videos/n1.json`: it predates these rules (news label, `target`, spoken follow line). Draw generic shapes, no real logos. **Photos (pipeline2 only; skip them while v1 is the default, v1 draws everything in code):** up to 2 beats may show a real photo. In `vN.scenes.json` add an item `{"k":"photo","src":"<short-name>","q":"<search words naming the exact subject>","x":0.1,"y":0.25,"w":0.8,"h":0.38,"at":0.3}` (the box is at most 60% of the drawing, labels and arrows are drawn around it), then run `python3 photos.py videos/vN.json` before `build.mjs` (needs api.openverse.org; cc0 and public domain only; flow.json "photos"). Open every file in `videos/vN.photos/` and look at it: if it is not clearly the subject the beat says, shows a recognisable private person, has text or a watermark over it, or looks AI-made, delete the item from the scenes and keep the beat drawn. A missing photo is fine: the beat keeps its other items. Put `Photo: <creator or source>` (from `videos/vN.photos/credits.json`) on one line in the description when the creator is known. Never use photos in ideas or docs. Worked example: `pipeline2/videos/n-quake.json` + `n-quake.scenes.json`.

## Hand in

Slot: the next of the posting times (`postTimesIST` in `platforms/instagram.json`) that is at least 1 hour away, for both lanes. The publisher posts approved news at its next run whatever the slot says, so the slot is only a hint for the review card.

Reuse the claimed story id.

1. `inbox.sh up <mp4> <id>`.
2. `inbox.sh call` with `release` + `by` setting: `"type":"video"`, `"status":"pending"`, `"title":"<yt title>"`, `"slot":"<YYYY-MM-DD>T<HH:MM>:00+05:30"`, `"summary":"<story in one line>. <duration> s, <verification result>. Sources: <URLs>"`, and `data` with `lane`, `sources`, `search` (from the story card), `videoRef` (SKILL.md format), `yt` (title + " #shorts", no clickbait), `ig` (caption + "Follow @howtohero.official" + 3-4 hashtags; both written to SKILL.md "Publish kit", which uses the card's `search` phrase), `pin`, `note` ("NEWS - check facts against sources before posting. Description must list the sources." plus, for lane A, "Trending story: post the same day or it goes stale."), and `reminder` = "YouTube title:\n<yt>\n\nDescription:\n<one-line summary>\nSources: <URLs>\n\nInstagram:\n<ig>\n\nPinned comment:\n<pin>". Set the status to `pending` only now, so the video reaches the person once the file is attached.
