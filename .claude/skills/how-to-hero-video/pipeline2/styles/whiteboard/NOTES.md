# Whiteboard

A dry-erase marker lesson on a glossy white board. Good for "how does X work" topics with simple diagrams.

- **Paper:** warm white with a slow diagonal sheen, plus a dozen very faint ghost marks, as if earlier drawings had been wiped off.
- **Pen:** round marker, 7 px by default, with a light hand wobble. Ink is multiplied, so crossings get darker.
  A small pooled dot sits inside the start of every stroke, and a dry-streak texture is laid over the ink in `post`.
- **Colours:** ink (near black), accent (blue), warn (red), good (green), muted (grey). Use at most three in one beat.
- **Type:** Kalam bold for everything, captions included, so it reads as one hand.
- **Captions:** ink on a yellow highlighter bar per line. The yellow is a prop of this kit, not a colour role.
- **Highlight (`hl`):** a flat marker swipe, red unless the item gives a role.
- **Between beats:** an eraser sweeps left to right over the last 0.45 s and leaves a faint trace of the drawing.
- **Charts:** `bars` get a light marker wash inside each bar; the engine still draws outlines and labels.
- **Hook, end card and mascot** come from the brand layer and are not changed here.

Things to avoid: long dashed lines (each dash gets its own pooled dot), and items near the top of beat 1 when
there is a hook, because the eraser passes under the hook but not over it.

Test scene: `golden.json` with `golden.scenes.json` (title, process, chart). Build it with
`node build.mjs styles/whiteboard/golden.json --estimate --out <dir>` and render stills with `--frames`.

Reference for the look (not copied): upstream `lemo-opuscar/styles/whiteboard`. The code and this note are our own.
