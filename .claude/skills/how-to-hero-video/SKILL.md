---
name: how-to-hero-video
description: Make one vertical "How To Hero" explainer video (1080x1920, 40-60 s by default, up to 120-150 s for deeper ideas, voiceover, captions, mascot end card) for a queued idea in the How To Hero artifact, verify it, upload it and fill the card's reply. Use for the nightly queue run or when asked to make a How To Hero video.
---

# How To Hero video

Pipeline lives in `pipeline/` next to this file (HyperFrames + Kokoro TTS + GSAP + ffmpeg + Chromium; all free, no signups). Work from a scratch copy so the repo stays clean.

## Nightly run: loop, one video at a time

Two scheduled workers run in parallel and never share a card, because every card is claimed with the worker's id before work starts. Each worker makes ONE video at a time and uploads it before starting the next, so a usage limit only loses the video in progress.

Worker id: your letter from the task prompt plus 4 random characters, e.g. `A-7f3k`. Pick it once at the start.

0. Free storage first. The artifact's asset storage is capped at 1 GB, so clean up posted videos before building. Query `ideas` with `stage` == "posted". For each card whose `videoRef` has a `Video: /_blob/<id>` line, delete that asset (`Artifact` action `delete`, `url` = artifact, `path` = `<id>`). Then re-read the card and `update` it with `if_version`, replacing that line with `Video: deleted after posting`. This is the one exception to "never touch other docs". Skip a card if its blob id also appears on a card that is not posted.
0b. Sync Drive folders. Videos live in the user's Google Drive under "How To Hero videos", in one folder per status: `review` (1 Needs review), `ready` (2 Ready to post), `posted` (3 Posted). Query `ideas` for cards with a `driveId`. Wanted folder by `stage`: queued/review = `review`, approved = `ready`, posted = `posted` (leave others alone). For each card whose `driveFolder` differs, run `drive.sh move <driveId> <folder>`, then re-read the card and `update` it with `if_version` setting `driveFolder`. This is the one exception to "never touch other docs".
1. Read the artifact URL from the task prompt. `ArtifactData query` collection `ideas`, `stage` == "queued". Candidates: empty `videoRef` and not in progress. A card is in progress if it has `claimedBy` set and `claimedAt` is less than 3 hours old; an older claim is stale and the card is free again. Take the earliest `slot` (worker A) or the latest `slot` (worker B). None: stop and say "queue empty".
2. Claim it: `update` with `if_version` setting `claimedBy` = your worker id and `claimedAt` = now (ISO). The pin makes this atomic: if it is refused, the other worker got there first, so re-query and pick again. Then re-read the card and confirm `claimedBy` is your id. Never build a card you did not win.
3. Make that video with the worker steps below. On success clear both fields (`{"__delete__": true}`) in the same update that sets `videoRef`; on failure clear them and write the reason into `note`.
4. Go back to step 1. Stop the session if a video fails twice, or after 8 videos. Say how many were made.

## Worker steps

Make exactly the claimed doc (use `topic` + `angle`, plus `hook`/`aha` if present), using "Build one video" below. Length cap: the doc's `maxSeconds`, else by `series` (A 120, B 120, C 150, D 120), else 60. Fact check: if the doc's `fact` is K (to check), look up a named source for every number and date before writing; if you cannot, leave `videoRef` empty, remove `claimedBy` and `claimedAt` and write why into `note`. If `fact` is C (contested), the narration says "scientists think" and names the evidence. Then:
- Upload the MP4 to Google Drive: `drive.sh up out/<file>.mp4 review` (`drive.sh` is next to this file; `DRIVE_UPLOAD_URL` and `DRIVE_UPLOAD_TOKEN` come from the task prompt, export them and never write them into the repo, a card or a reply). It prints `{"id","url"}`. Make the card thumbnail with `drive.sh thumb out/<file>.mp4`. Do not upload videos to the artifact's asset storage (it is capped at 1 GB). If the Drive upload fails twice, treat it as a failure below.
- Re-read the doc, `ArtifactData update` with `if_version`: `videoRef` = `<file> | <duration> s | ffprobe: 1080x1920, 30 fps, H.264 yuv420p + AAC stereo 48 kHz, <MB> MB | audio peak <dB> dB | safe zone: <n> violations` + newline + `Video: <drive url>`, `driveId` = the id, `driveFolder` = "review", `thumb` = the data URI, `claimedBy` and `claimedAt` = `{"__delete__": true}`.
- Publish kit, in the same update as `videoRef` (the person posts by hand and copies these): `yt` = the title, at most 70 characters, the claim first and the searchable noun in it ("India Had Its Own Horned Killer Dinosaur: Rajasaurus"), no "in 60 Seconds", ending in ` #shorts`; `ig` = first line holds the topic keywords, second line one extra fact, then `Sources: <names>`, then `Follow @howtohero.official` and 3 to 5 specific hashtags (never #reels, #explore, #viral); `pin` = one specific question the video raises, for the pinned comment. Overwrite an existing `yt` or `ig` only when it breaks these rules.
- On failure after two render attempts: leave `videoRef` empty, remove `claimedBy` and `claimedAt`, write the reason into `note`.
- Never change `stage`, never touch other docs, never overwrite a non-empty `videoRef`. The human reviews and sends to review.
- Final reply: file name, duration, verification result.

## Build one video (id vN: use the next unused number in `videos/`; existing files there are worked examples)

1. `cp -r pipeline /tmp/hth && cd /tmp/hth && mkdir -p work out && cp -r base-skeleton work/_base`. First run needs `npm i hyperframes@0.9.30` available to `npx`; telemetry off.
2. Write `videos/vN.json` (see `videos/v1.json`): `file` = `how-<topic>-works.mp4`, a 2-line `hook` (≤ 22 chars/line, ONE yellow word), `topic` (the subject in 1-3 words), `maxSeconds` (the cap above), `beats` lines and `card` lines (see `videos/v17.json`). Rules that decide whether a viewer stays (63% of our first viewers swiped away, so these are not optional):
   - Hook: a surprising claim or a contradiction ("GPS NEVER SENDS ANYTHING"), never a question and never the topic restated. Test: cover the topic label; the hook must still say something a viewer did not know.
   - First spoken line: the same claim, in at most 12 words. Background and dates come after it.
   - Length: as long as the story needs and no longer. Do not set `target` (it stretches the voice to 58 s); a 60 s cap usually means 7-9 spoken beats and 40-50 s. About 2.6 words per second.
   - Ending: the last spoken line is the payoff, ideally something the viewer would repeat to a friend. No spoken "follow" line. The final beat is the silent end card: `{ "hold": 1.6 }` with `card` lines `["FOLLOW FOR MORE", "HOW TO HERO"]`.
   Plain present or past tense. Accurate and conceptual: invent no numbers, show no real logos/brands.
3. Write `videos/vN.scenes.js`: one diagram block per spoken line in the style of `videos/v17.scenes.js` (the silent end card is drawn by `finish.js`, do not draw it). Beat 1 is on screen from frame 0: draw its main picture with no `pop`/`fadeIn`, below the headline (local y ≥ 330), and make something move in the first second (a `U.push` loop). To `pop` a shape that has `scale()` in its transform, wrap it in a plain `<g>` and pop the group using helpers from `lib/lib.js`. Every beat is drawn in the 880x760 box inside the safe zone. Anton has no ₹ or ✓ glyph: draw them as shapes.
4. `node build.mjs vN`, then in `work/vN`: `npx hyperframes check` (0 errors) and `npx hyperframes snapshot` per beat; look at every beat for clipped or invisible elements; fix.
4b. Cover rule: the headline and key visual must be fully visible from frame 0 (no fade-in, no blank intro); `finish.js` draws a yellow topic label ("HOW JET ENGINES WORK", from `file`, or set `topic` in vN.json) above the hook so the first frame names the subject even when the hook is a teaser; the Instagram grid and Shorts shelf show an early frame. After rendering, also save `out/vN.cover.png` = a 1080x1920 frame at t=0.5 s (`ffmpeg -ss 0.5 -i vN.mp4 -frames:v 1 out/vN.cover.png`) and check the headline is readable in it.
5. `npx hyperframes render -q high -o ../../out/vN.raw.mp4` (~2-5 min; renders are CPU-heavy, run one at a time), then `python3 verify.py vN` (remux, ffprobe, peak, screenshots at 2 s/30 s/last 5 s, safe-zone audit). Duration must be within the cap plus 2 s: if `build.mjs` reports a longer end, shorten the narration lines and rebuild before rendering. Required: 1080x1920, 30 fps, H.264 + AAC stereo 48 kHz, < 100 MB, within the cap plus 2 s (verify.py reads `maxSeconds`), 0 violations, no clipping, and no `cover:` or `opening:` line (the frame at 0.1 s must show a drawing under the headline, and the picture must change within 3 s). Otherwise fix and re-render.

## Rules

Brand: navy 1F2A6B, yellow FFC531, red E5384F, white, Anton caps, dark navy gradient, progress bar at bottom edge, stick-man hero end card. Safe zone: all key content inside x 60-940, y 420-1500; headline ≥ 90 px; captions ≥ 56 px, ≤ 2 lines around y 1250-1450. Hook text on screen in the first 2 s. Known pitfalls: never `gsap.set(opacity)` on elements later driven by `setAttribute`; use `fadeTo` for translucent elements; end-card text is 72 px (known deviation, mention it).
