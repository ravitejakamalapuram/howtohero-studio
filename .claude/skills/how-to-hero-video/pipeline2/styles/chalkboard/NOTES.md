# Chalkboard

A green slate in a wooden frame, drawn on with white and coloured chalk. Good for science and "here is the trick" explainers.

- **Roles:** ink is white chalk, accent yellow, warn pink, good green, muted pale blue. Keep most of a scene white and save the colours for the one thing that matters.
- **Board:** a soft radial green, blurred cloudy patches and faint tilted eraser streaks from old wipes, fine white dust, and a wood strip top and bottom.
- **Chalk line:** three thin passes that do not quite overlap, so edges look dry and broken. Starts and stops are pressed a little harder, and two loose grains are left where the chalk lifts off.
- **Grain:** `post` lays dark slate specks over everything, so the board shows through the chalk, the text and the captions.
- **Text:** Cabin Sketch for headings, Patrick Hand for body and captions, with a faint offset copy for a powdery edge.
- **Highlight:** a chalk underline along the bottom of the box, not a filled block.
- **Fill (`mk`):** native. Wide, faint diagonal strokes, like shading with the side of the chalk.
- **Transition:** in the last 0.45 s of a beat the drawing fades into a wipe haze. Captions, hook and end card are left to the brand layer.

Ported from the prototype `CHALKBOARD` kit; the prototype's `w y p b g` colours map to `ink accent warn muted good`.
New compared with the prototype: blurred patches, eraser streaks, pressed stroke ends, lift-off grains, the native fill, and sizes that follow the format.

Golden scene: `golden.json` with `golden.scenes.json` (title, process, chart). Build with
`node build.mjs styles/chalkboard/golden.json --estimate --out <dir>`, then `node render.cjs <dir>/page.json <prefix> --frames 0.5,4.2,9.8,14.6,18`.

Reference for the look (not copied): upstream `lemo-opuscar/styles/chalkboard`. Its stroke baking, per-stroke width profiles and erase path are not ported.
