---
name: how-to-hero-video
description: Make one vertical "How To Hero" explainer video (1080x1920, ~57-60 s, voiceover, captions, mascot end card) for a queued idea in the How To Hero artifact, verify it, upload it and fill the card's reply. Use for the nightly queue run or when asked to make a How To Hero video.
---

# How To Hero video

Pipeline lives in `pipeline/` next to this file (HyperFrames + Kokoro TTS + GSAP + ffmpeg + Chromium; all free, no signups). Work from a scratch copy so the repo stays clean.

## Nightly queue run (orchestrator: never renders anything itself)

1. Read the artifact URL from the task prompt. `ArtifactData list` collection `ideas`. Candidates: `stage` = "queued", empty `videoRef`, and no `claimedAt` newer than 20 hours. Sort by `slot`, take at most 5. None: stop and say so.
2. For each candidate: `update` the doc (with `if_version`) setting `claimedAt` = now (ISO). Skip it if the write is refused.
3. Spawn one separate session per candidate with `mcp__claude-code-remote__create_session` (`source_url` = https://github.com/ravitejakamalapuram/howtohero-studio, same environment, `prompt` = "Use the how-to-hero-video skill, section 'Worker: one video'. Artifact: <url>. Doc id: <id>."). One video per session, so a usage limit only loses that one video. Do not wait for them.
4. Reply with one line per spawned session (doc id, session id).

## Worker: one video

Make exactly the one doc named in the prompt (read it; use only `topic` + `angle`), using "Build one video" below. Then:
- Upload the MP4 with `Artifact` (`asset: true`, `url` = artifact, `file_path`).
- Re-read the doc, `ArtifactData update` with `if_version`: `videoRef` = `<file> | <duration> s | ffprobe: 1080x1920, 30 fps, H.264 yuv420p + AAC stereo 48 kHz, <MB> MB | audio peak <dB> dB | safe zone: <n> violations` + newline + `Video: /_blob/<id>`, and `claimedAt` = `{"__delete__": true}`.
- On failure after two render attempts: leave `videoRef` empty, remove `claimedAt`, write the reason into `note`.
- Never change `stage`, never touch other docs, never overwrite a non-empty `videoRef`. The human reviews and sends to review.
- Final reply: file name, duration, verification result.

## Build one video (id vN: use the next unused number in `videos/`; existing files there are worked examples)

1. `cp -r pipeline /tmp/hth && cd /tmp/hth && mkdir -p work out && cp -r base-skeleton work/_base`. First run needs `npm i hyperframes@0.9.30` available to `npx`; telemetry off.
2. Write `videos/vN.json` (see `videos/v1.json`): `file` = `how-<topic>-works.mp4`, a 2-line `hook` (≤ 22 chars/line, ONE yellow word), 10 `beats` lines (~155-170 words total, plain present tense, last line "Follow for how things work, in a minute."), `card` lines. Accurate and conceptual: invent no numbers, show no real logos/brands.
3. Write `videos/vN.scenes.js`: one diagram block per narration line (8-9 beats) in the style of `videos/v1.scenes.js` using helpers from `lib/lib.js`. Every beat is drawn in the 880x760 box inside the safe zone. Anton has no ₹ or ✓ glyph: draw them as shapes.
4. `node build.mjs vN`, then in `work/vN`: `npx hyperframes check` (0 errors) and `npx hyperframes snapshot` per beat; look at every beat for clipped or invisible elements; fix.
5. `npx hyperframes render -q high -o ../../out/vN.raw.mp4` (~2-5 min; renders are CPU-heavy, run one at a time), then `python3 verify.py vN` (remux, ffprobe, peak, screenshots at 2 s/30 s/last 5 s, safe-zone audit). Required: 1080x1920, 30 fps, H.264 + AAC stereo 48 kHz, < 100 MB, ≤ 62 s, 0 violations, no clipping. Otherwise fix and re-render.

## Rules

Brand: navy 1F2A6B, yellow FFC531, red E5384F, white, Anton caps, dark navy gradient, progress bar at bottom edge, stick-man hero end card. Safe zone: all key content inside x 60-940, y 420-1500; headline ≥ 90 px; captions ≥ 56 px, ≤ 2 lines around y 1250-1450. Hook text on screen in the first 2 s. Known pitfalls: never `gsap.set(opacity)` on elements later driven by `setAttribute`; use `fadeTo` for translucent elements; end-card text is 72 px (known deviation, mention it).
