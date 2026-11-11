---
name: how-to-hero-video
description: Make one vertical "How To Hero" explainer video (1080x1920, 60 s by default, up to 120-150 s for deeper ideas, voiceover, captions, mascot end card) for a queued idea in the How To Hero artifact, verify it, upload it and fill the card's reply. Use for the nightly queue run or when asked to make a How To Hero video.
---

# How To Hero video

Pipeline lives in `pipeline/` next to this file (HyperFrames + Kokoro TTS + GSAP + ffmpeg + Chromium; all free, no signups). Work from a scratch copy so the repo stays clean.

## Nightly run: loop, one video at a time

Two scheduled workers run in parallel and never share a card, because every card is claimed with the worker's id before work starts. Each worker makes ONE video at a time and uploads it before starting the next, so a usage limit only loses the video in progress.

Worker id: your letter from the task prompt plus 4 random characters, e.g. `A-7f3k`. Pick it once at the start.

1. Read the artifact URL from the task prompt. `ArtifactData query` collection `ideas`, `stage` == "queued". Candidates: empty `videoRef` and not in progress. A card is in progress if it has `claimedBy` set and `claimedAt` is less than 3 hours old; an older claim is stale and the card is free again. Take the earliest `slot` (worker A) or the latest `slot` (worker B). None: stop and say "queue empty".
2. Claim it: `update` with `if_version` setting `claimedBy` = your worker id and `claimedAt` = now (ISO). The pin makes this atomic: if it is refused, the other worker got there first, so re-query and pick again. Then re-read the card and confirm `claimedBy` is your id. Never build a card you did not win.
3. Make that video with the worker steps below. On success clear both fields (`{"__delete__": true}`) in the same update that sets `videoRef`; on failure clear them and write the reason into `note`.
4. Go back to step 1. Stop the session if a video fails twice, or after 8 videos. Say how many were made.

## Worker steps

Make exactly the claimed doc (use `topic` + `angle`, plus `hook`/`aha` if present), using "Build one video" below. Length cap: the doc's `maxSeconds`, else by `series` (A 120, B 120, C 150, D 120), else 60. Fact check: if the doc's `fact` is K (to check), look up a named source for every number and date before writing; if you cannot, leave `videoRef` empty, remove `claimedAt` and write why into `note`. If `fact` is C (contested), the narration says "scientists think" and names the evidence. Then:
- Upload the MP4 with `Artifact` (`asset: true`, `url` = artifact, `file_path`).
- Re-read the doc, `ArtifactData update` with `if_version`: `videoRef` = `<file> | <duration> s | ffprobe: 1080x1920, 30 fps, H.264 yuv420p + AAC stereo 48 kHz, <MB> MB | audio peak <dB> dB | safe zone: <n> violations` + newline + `Video: /_blob/<id>`, `claimedBy` and `claimedAt` = `{"__delete__": true}`.
- On failure after two render attempts: leave `videoRef` empty, remove `claimedAt`, write the reason into `note`.
- Never change `stage`, never touch other docs, never overwrite a non-empty `videoRef`. The human reviews and sends to review.
- Final reply: file name, duration, verification result.

## Build one video (id vN: use the next unused number in `videos/`; existing files there are worked examples)

1. `cp -r pipeline /tmp/hth && cd /tmp/hth && mkdir -p work out && cp -r base-skeleton work/_base`. First run needs `npm i hyperframes@0.9.30` available to `npx`; telemetry off.
2. Write `videos/vN.json` (see `videos/v1.json`): `file` = `how-<topic>-works.mp4`, a 2-line `hook` (≤ 22 chars/line, ONE yellow word), `maxSeconds` (the cap above), and `beats` lines (10 for a 60 s video, about 2.7 words per second of cap minus the end card, so a 120 s video is about 20 beats; plain present tense, last line "Follow for how things work, in a minute."), `card` lines. Accurate and conceptual: invent no numbers, show no real logos/brands.
3. Write `videos/vN.scenes.js`: one diagram block per narration line (8-9 beats) in the style of `videos/v1.scenes.js` using helpers from `lib/lib.js`. Every beat is drawn in the 880x760 box inside the safe zone. Anton has no ₹ or ✓ glyph: draw them as shapes.
4. `node build.mjs vN`, then in `work/vN`: `npx hyperframes check` (0 errors) and `npx hyperframes snapshot` per beat; look at every beat for clipped or invisible elements; fix.
4b. Cover rule: the headline and key visual must be fully visible from frame 0 (no fade-in, no blank intro); the Instagram grid and Shorts shelf show an early frame. After rendering, also save `out/vN.cover.png` = a 1080x1920 frame at t=0.5 s (`ffmpeg -ss 0.5 -i vN.mp4 -frames:v 1 out/vN.cover.png`) and check the headline is readable in it.
5. `npx hyperframes render -q high -o ../../out/vN.raw.mp4` (~2-5 min; renders are CPU-heavy, run one at a time), then `python3 verify.py vN` (remux, ffprobe, peak, screenshots at 2 s/30 s/last 5 s, safe-zone audit). Duration must be ≤ 62 s: if `build.mjs` reports end > 62 s or the render is longer, shorten the narration lines and rebuild before rendering. Required: 1080x1920, 30 fps, H.264 + AAC stereo 48 kHz, < 100 MB, within the cap plus 2 s (verify.py reads `maxSeconds`), 0 violations, no clipping. Otherwise fix and re-render.

## Rules

Brand: navy 1F2A6B, yellow FFC531, red E5384F, white, Anton caps, dark navy gradient, progress bar at bottom edge, stick-man hero end card. Safe zone: all key content inside x 60-940, y 420-1500; headline ≥ 90 px; captions ≥ 56 px, ≤ 2 lines around y 1250-1450. Hook text on screen in the first 2 s. Known pitfalls: never `gsap.set(opacity)` on elements later driven by `setAttribute`; use `fadeTo` for translucent elements; end-card text is 72 px (known deviation, mention it).
