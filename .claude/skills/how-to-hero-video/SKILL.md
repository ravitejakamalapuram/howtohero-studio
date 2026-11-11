---
name: how-to-hero-video
description: Make one vertical "How To Hero" explainer video (1080x1920, 60 s by default, up to 120-150 s for deeper ideas, voiceover, captions, mascot end card) for a queued idea in the How To Hero artifact, verify it, upload it and fill the card's reply. Use for the nightly queue run or when asked to make a How To Hero video.
---

# How To Hero video

Pipeline lives in `pipeline/` next to this file (HyperFrames + Kokoro TTS + GSAP + ffmpeg + Chromium; all free, no signups). Work from a scratch copy so the repo stays clean.

## Nightly run: one routine, parallel at the start

A single scheduled routine runs this. How many videos it makes:
1. Read the artifact URL from the task prompt. `ArtifactData get` collection `meta`, doc `videoBurst`. Missing = this is the first run: make up to 2 videos in parallel. Present = make 1 video.
2. `ArtifactData list` collection `ideas`. Candidates: `stage` = "queued", empty `videoRef`, and no `claimedAt` newer than 20 hours, ordered by earliest `slot`. None: stop and say so (still write `videoBurst` if it was missing and the first run).
3. For 1 video: claim the first candidate (`update` with `if_version` setting `claimedAt` = now ISO; if refused, re-read and take the next) and do the Worker steps yourself.
4. For a burst: claim up to 2 candidates one after another the same way, then in ONE message start one subagent per claimed idea (Agent tool, general-purpose), each told: its doc id, the artifact URL, "follow the Worker steps and Build one video sections of this SKILL.md, use scratch dir /tmp/hth-<id>, render with -w 2 if available, do not touch other docs". If the Agent tool is unavailable, build them one after another. Renders are CPU-heavy, so if renders fail from load, retry that one alone.
5. After claiming, `ArtifactData set` `meta/videoBurst` = {"done": true, "at": <ISO>} (only on the first run).
6. Reply with one line per video: doc id, file name, duration, verification result.

## Worker steps

Make exactly the claimed doc (use `topic` + `angle`, plus `hook`/`aha` if present), using "Build one video" below. Length cap: the doc's `maxSeconds`, else by `series` (A 120, B 120, C 150, D 120), else 60. Fact check: if the doc's `fact` is K (to check), look up a named source for every number and date before writing; if you cannot, leave `videoRef` empty, remove `claimedAt` and write why into `note`. If `fact` is C (contested), the narration says "scientists think" and names the evidence. Then:
- Upload the MP4 with `Artifact` (`asset: true`, `url` = artifact, `file_path`).
- Re-read the doc, `ArtifactData update` with `if_version`: `videoRef` = `<file> | <duration> s | ffprobe: 1080x1920, 30 fps, H.264 yuv420p + AAC stereo 48 kHz, <MB> MB | audio peak <dB> dB | safe zone: <n> violations` + newline + `Video: /_blob/<id>`, and `claimedAt` = `{"__delete__": true}`.
- On failure after two render attempts: leave `videoRef` empty, remove `claimedAt`, write the reason into `note`.
- Never change `stage`, never touch other docs, never overwrite a non-empty `videoRef`. The human reviews and sends to review.
- Final reply: file name, duration, verification result.

## Build one video (id vN: use the next unused number in `videos/`; existing files there are worked examples)

1. `cp -r pipeline /tmp/hth && cd /tmp/hth && mkdir -p work out && cp -r base-skeleton work/_base`. First run needs `npm i hyperframes@0.9.30` available to `npx`; telemetry off.
2. Write `videos/vN.json` (see `videos/v1.json`): `file` = `how-<topic>-works.mp4`, a 2-line `hook` (≤ 22 chars/line, ONE yellow word), `maxSeconds` (the cap above), and `beats` lines (10 for a 60 s video, about 2.7 words per second of cap minus the end card, so a 120 s video is about 20 beats; plain present tense, last line "Follow for how things work, in a minute."), `card` lines. Accurate and conceptual: invent no numbers, show no real logos/brands.
3. Write `videos/vN.scenes.js`: one diagram block per narration line (8-9 beats) in the style of `videos/v1.scenes.js` using helpers from `lib/lib.js`. Every beat is drawn in the 880x760 box inside the safe zone. Anton has no ₹ or ✓ glyph: draw them as shapes.
4. `node build.mjs vN`, then in `work/vN`: `npx hyperframes check` (0 errors) and `npx hyperframes snapshot` per beat; look at every beat for clipped or invisible elements; fix.
4b. Cover rule: the headline and key visual must be fully visible from frame 0 (no fade-in, no blank intro); the Instagram grid and Shorts shelf show an early frame. After rendering, also save `out/vN.cover.png` = a 1080x1920 frame at t=0.5 s (`ffmpeg -ss 0.5 -i vN.mp4 -frames:v 1 out/vN.cover.png`) and check the headline is readable in it.
5. `npx hyperframes render -q high -o ../../out/vN.raw.mp4` (~2-5 min; renders are CPU-heavy, run one at a time), then `python3 verify.py vN` (remux, ffprobe, peak, screenshots at 2 s/30 s/last 5 s, safe-zone audit). Required: 1080x1920, 30 fps, H.264 + AAC stereo 48 kHz, < 100 MB, within the cap plus 2 s (verify.py reads `maxSeconds`), 0 violations, no clipping. Otherwise fix and re-render.

## Rules

Brand: navy 1F2A6B, yellow FFC531, red E5384F, white, Anton caps, dark navy gradient, progress bar at bottom edge, stick-man hero end card. Safe zone: all key content inside x 60-940, y 420-1500; headline ≥ 90 px; captions ≥ 56 px, ≤ 2 lines around y 1250-1450. Hook text on screen in the first 2 s. Known pitfalls: never `gsap.set(opacity)` on elements later driven by `setAttribute`; use `fadeTo` for translucent elements; end-card text is 72 px (known deviation, mention it).
