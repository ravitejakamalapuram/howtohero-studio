# pipeline2: one video, many styles

A video is two data files. A style is one kit file. Any video renders in any style.

```
videos/<id>.json          the words: hook, beats (what is said), end card, audio, style
videos/<id>.scenes.json   the pictures: items per beat, with no colours or pixels in them
styles/<slug>/kit.js      a style: paper, pen, fonts, colours
styles/registry.json      what each style is: formats, fit (kinds, topics), paper colour
../flow.json              how often each style is used: weight and status (core, trial, accent-only, retired)
engine/                   engine.js draws; brand.js keeps hook, captions, end card and mascot the same in every style
```

## Build and render

```
node build.mjs <id> --audio <voice.m4a>      # checks the files, picks a style if none is set, writes work/<id>/page.json
node render.cjs work/<id>/page.json out.mp4  # about 3 minutes for a 60 s Short; run one render at a time
node render.cjs work/<id>/page.json /tmp/x --frames 0.5,12,58   # stills: /tmp/x-0.5.png ...
node render.cjs work/<id>/page.json out.mp4 --style chalkboard  # same video, another style
node schema.mjs videos/<id>.json             # only check the two files
node flow.mjs resolve videos/<id>.json       # pick the style once and write style + flowSha into the video
node flow.mjs check                          # validate ../flow.json
node flow.mjs explain                        # print the settings and each style's share
```

Timing comes from `"audio": { "file", "starts": [...] }` (a finished voice track and the second each beat starts),
or from Kokoro (`npx hyperframes tts`, as in the old pipeline) when there is no `audio`,
or from `--estimate` (no sound, 2.6 words a second; for tests).
Voice tracks are not kept in the repo (`*.m4a` and `*.wav` are ignored): `--audio <file>` says where the track named in `audio.file` is. Without it the build looks next to the video json and stops if the track is not there.
The last beat is always the end card. Captions are cut from each beat's `say`, at most 2 lines at a time.

## Check

```
python3 verify.py work/<id>/page.json out.mp4   # size, length, sound, caption contrast, end card, safe zone; exit 1 on a failure
python3 sheet.py work/<id>/page.json out.mp4    # contact sheet: 0.5 s, one frame per beat, end card -> out.sheet.png
node --test && python3 -m unittest discover -s test   # tests for the picker, the schema and verify.py's colour checks
```

`verify.py` reads the style's `paper` and `luma` from `styles/registry.json`. After `render.cjs --style <slug>`, give `verify.py` the same `--style`.

## Scene rules

- `x`, `y` are 0..1 inside the safe box (Short: x 60-940, y 200-1360 px; the right edge clears the like and comment buttons on all three apps). Sizes (`s`, `r`, `lw`...) are fractions of the box width.
- `at` is seconds after the beat starts, or `"word:<word>"` to start when that word is spoken. The build moves a label (`text`, `label`, `banner`, `num`) earlier when it would finish less than 1.3 s before its beat ends.
- Colour is a role: `ink`, `accent`, `warn`, `good`, `muted`, `paper`. Never a hex value.
- A text with no `max` is one line: it shrinks (to 60% at most) to stay inside the box, or inside `fit` (a width, as a fraction of the box width on a Short). Give two labels that sit side by side a `fit` each. With `max` the text wraps instead.
- A scene beat may carry a `shot`, so the scene file reads like a shot list: `{ "style", "subject", "action", "camera", "framing", "motion", "light", "ai" }`. All fields are optional; no `shot` means static, wide, draw-on, in the video's primary style.
  - `framing` zooms the beat's items about the middle of the box: `wide` 1.0, `medium` 1.25, `close` 1.6.
  - `camera` moves them across the beat: `static`, `pan-left`, `pan-right`, `pan-up`, `pan-down` (6% of the box each way), `push-in`, `pull-out` (12%), `follow` (leans toward the beat's `move` item). Items are cut off at the box edge, so look at stills of the end of a moving beat. Hook, captions, progress bar and end card never move.
  - `style` names the kit for that beat; a video may use one kit besides its primary.
  - `subject`, `action`, `motion` (`draw-on`, `slide`, `pop`, `morph`) and `light` (`flat`, `spot`, `vignette`) are the plan in words; the engine does not act on them yet.
  - `ai` is `null` or a text prompt for an outside video model. `build.mjs` and `render.cjs` never read it and it is not copied into `page.json`.
- `cast` in the video json maps a character to one description (`{ "mascot": "small hero, red cape, round head" }`). Use those exact words wherever the character is described, so it never drifts between beats.
- When the video has a `hook`, keep beat 1 below y 0.28.
- Item kinds and their fields are listed in `schema.mjs`; icons in `engine/icons.js`.

## Add a style

1. Copy `styles/_template/` to `styles/<slug>/` and change `kit.js`. Only `tokens`, `bg` and `pen` are required.
2. Add an entry to `styles/registry.json` and a `"<slug>": { "weight": 1, "status": "trial" }` entry under `style.kits` in `../flow.json`.
3. Render stills of an existing video with `--style <slug>` and look at them.

A kit changes stroke, texture and font. It does not change wording, layout, caption size or the red cape.

Fonts are from Google Fonts under the SIL Open Font License (`fonts/OFL.txt`). Other notices are in [THIRD_PARTY.md](THIRD_PARTY.md).
