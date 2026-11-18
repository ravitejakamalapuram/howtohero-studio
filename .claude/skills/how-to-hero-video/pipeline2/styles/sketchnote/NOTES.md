# Sketchnote

A notebook page filled in by hand: black fineliner outlines, a few fat markers for colour, hand lettering.
Good for nature, health, history and everyday topics.

- **Paper:** off-white with a faint dot grid and light grain. The dots move with the page.
- **One page, camera pans:** each beat sits one box-height below the last and the camera slides down to it in 0.9 s.
  The beat before stays drawn, so anything it put below y 0.83 is still visible at the top of the next beat.
- **Pen:** thin fineliner (about 4.5 px) with a small wobble, a faint second pass, and an ink dot where it lands and lifts.
- **Colours:** ink and muted are pens. `warn` (red) and `good` (green) are coloured pens for lines and text.
  `accent` is the yellow marker: an accent line is a yellow stroke with the ink line on top, and accent text is
  ink on a yellow swipe. Keep yellow for the one thing the video follows.
- **Marker fills (`mk`, `hl`, bar wash):** translucent multiplied bands in any role; `muted` is the grey shadow marker.
- **Banner:** a ribbon of clean paper with an ink outline and a grey marker shadow. A `role` tints the ribbon.
- **Type:** Kalam bold for headings, Patrick Hand for captions and small labels (`"font": "body"`).
- **Captions:** ink on a strip of clean paper per line.
- **Hook, end card and mascot** come from the brand layer. The prototype's own end card (banner plus tree) is gone.

Avoid: yellow on everything, large black fills. The prototype's blue and brown markers have no role; use `muted`.

Test scene: `golden.json` with `golden.scenes.json` (title, process, chart). Build with
`node build.mjs styles/sketchnote/golden.json --estimate --out <dir>`, then render stills with `--frames`.

Reference for the look (not copied): upstream `lemo-opuscar/styles/sketchnote`. The code and this note are our own.
