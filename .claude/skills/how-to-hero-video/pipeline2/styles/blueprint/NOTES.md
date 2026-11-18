# Blueprint

Pale drafting lines on a blue cyanotype sheet. Good for machines, spacecraft, structures and anything you would measure.

- **Roles:** ink is the sheet's white line, accent pale yellow, warn salmon, good mint, muted light cyan. Draw the object in white and use one colour for the thing being pointed at.
- **Sheet:** a blue wash with soft lighter and darker patches (uneven exposure), a fine grid with a heavier line every fifth square, a border round the drawing area, paper fibre and darker corners. It is painted once in `init`.
- **Line:** straight and even, no wobble. A faint construction line shows the whole path first, then the ink follows it. The ink has a soft bleed and a small pool where the pen starts and stops.
- **Text:** B612 Mono for everything, regular weight, with a faint bleed edge. `textScale` is 1.3 as in the prototype, so prototype sizes port as `px / 960`. Mono letters are wide: a heading at `s` 0.044 holds about 27 characters.
- **Highlight:** a dashed call-out box, not a filled block.
- **Dimension (`dim`):** native. Thin line, slashed ticks, the label written along the line.
- **Fill (`mk`):** native. Thin 45 degree section hatching.
- **Transition:** in the last 0.45 s of a beat the drawing slides off to the left, like a sheet pulled from the table.
- **Captions:** capitals on a darker plate with a ruled edge. Position and size stay with the brand layer.
- **Title block:** bottom right, drawn in `post`: the video's topic, its id as the drawing number, and "SHEET n/N" counting beats (the end card is the last sheet). Left out when the format has no room under the captions (16:9).
- **Hook and end card:** left to the brand layer.

Ported from the prototype `BLUEPRINT` kit; its `w y r c` colours map to `ink accent warn muted`.
New compared with the prototype: exposure patches, darker corners, ink bleed and pooling, native hatching, a `good` colour, the sheet counter, and a title block that reads the video instead of fixed wording.

Golden scene: `golden.json` with `golden.scenes.json` (title, process, chart). Build with
`node build.mjs styles/blueprint/golden.json --estimate --out <dir>`, then `node render.cjs <dir>/page.json <prefix> --frames 0.5,4.2,10.4,16.4,19.5`.

Reference for the look (not copied): upstream `lemo-opuscar/styles/blueprint`. The code and this note are our own.
